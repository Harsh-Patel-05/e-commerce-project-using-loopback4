import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {UserProfile} from '@loopback/security';
import * as dotenv from 'dotenv';
import handlebars from 'handlebars';
import PDFDocument from 'pdfkit';
import {env} from 'process';
import puppeteer from 'puppeteer';
import Razorpay from 'razorpay';
import {promisify} from 'util';
import {AddressRepository, CartRepository, CustomerRepository, OrderRepository, PaymentRepository, ProductRepository, ProductVariantRepository, ShipmentStatusRepository} from '../repositories';
import {PaymentKeys} from '../shared/keys/payment.keys';
dotenv.config();


@injectable({scope: BindingScope.TRANSIENT})
export class PaymentService {
  private razorpay;

  constructor(
    @repository(OrderRepository)
    public orderRepository: OrderRepository,
    @repository(PaymentRepository)
    public paymentRepository: PaymentRepository,
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository,
    @repository(AddressRepository)
    public addressRepository: AddressRepository,
    @repository(ProductVariantRepository)
    public productVariantRepository: ProductVariantRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(CartRepository)
    public cartRepository: CartRepository,
    @repository(ShipmentStatusRepository)
    public shipmentStatusRepository: ShipmentStatusRepository,
  ) {
    // Initialize Razorpay instance
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async buyNow(
    payload: {
      productVariantId: string,
      quantity: number,
      cashOnDelivery: boolean,
      currency: string;
    },
    user: UserProfile
  ) {
    // const {user} = req;

    // Find customer by ID
    const customer = await this.customerRepository.findOne({
      where: {
        id: user.id,
        isDeleted: false,
      },
    });

    if (!customer) {
      return {
        statusCode: 404,
        message: PaymentKeys.CUSTOMER_NOT_FOUND,
      };
    }

    // Find customer's address
    const address = await this.addressRepository.findOne({
      where: {
        customerId: customer.id,
        isDeleted: false,
      },
    });

    if (!address) {
      return {
        statusCode: 404,
        message: PaymentKeys.ADDRESS_NOT_FOUND,
      };
    }

    const {productVariantId, quantity, cashOnDelivery} = payload;

    // Find the product variant
    const productVariant = await this.productVariantRepository.findOne({
      where: {
        id: productVariantId,
        isDeleted: false,
      },
    });

    if (!productVariant) {
      return {
        statusCode: 404,
        message: PaymentKeys.PRODUCT_NOT_FOUND,
      };
    }

    // Find the product associated with the product variant
    const product = await this.productRepository.findOne({
      where: {
        id: productVariant.productId,
        isDeleted: false,
      },
    });

    if (!product) {
      return {
        statusCode: 404,
        message: PaymentKeys.PRODUCT_NOT_FOUND,
      };
    }

    const totalPrice = productVariant.price * quantity;
    const {currency} = payload;

    if (cashOnDelivery) {
      // Create a payment for cash on delivery
      const payment = await this.paymentRepository.create({
        customerId: customer.id,
        COD: cashOnDelivery,
      });

      // Create an order for cash on delivery
      const order = await this.orderRepository.create({
        customerId: customer.id,
        paymentId: payment.id,
        paymentStatus: 'Pending',
        paymentMethod: 'cashOnDelivery',
        productIds: [productVariant.id],
        products: [productVariant],
        totalPrice,
        totalItems: quantity,
      });

      return {
        statusCode: 200,
        message: PaymentKeys.PAYMENT_CREATED,
        data: {info: 'cashOnDelivery'},
        order,
      };
    }

    const options = {
      amount: totalPrice * 100,
      currency,
      receipt: customer.email,
    };

    if (env.PAYMENT_MODE == '1') {
      // Use Razorpay for payment
      try {
        const res = await this.razorpay.orders.create(options);

        // Create a payment for online payment
        const payment = await this.paymentRepository.create({
          customerId: customer.id,
          COD: cashOnDelivery,
        });

        // Create an order for online payment
        const order = await this.orderRepository.create({
          customerId: customer.id,
          paymentId: payment.id,
          paymentStatus: 'done',
          paymentMethod: 'Online',
          productIds: [productVariant.id],
          products: [productVariant],
          totalPrice,
          totalItems: quantity,
        });

        return {
          statusCode: 200,
          message: PaymentKeys.PAYMENT_CREATED + 'razorpay',
          data: res,
          order,
        };
      } catch (error) {
        console.error('Razorpay error:', error);
        return {
          statusCode: 500,
          message: 'Error in Razorpay payment',
        };
      }
    }
  }

  // This function is used to get all payments
  async create(
    payload: {
      cashOnDelivery: boolean,
      currency: string;
    }, user: UserProfile) {
    const customer = await this.customerRepository.findOne({
      where: {
        id: user.id,
        isDeleted: false,
      },
    });

    if (!customer) {
      return {
        statusCode: 404,
        message: PaymentKeys.CUSTOMER_NOT_FOUND,
      };
    }

    const cart = await this.cartRepository.findOne({
      where: {
        customerId: customer.id,
        isDeleted: false,
      },
    });

    if (!cart) {
      return {
        statusCode: 404,
        message: PaymentKeys.CART_NOT_FOUND,
      };
    }

    const address = await this.addressRepository.findOne({
      where: {
        customerId: customer.id,
        isDeleted: false,
      },
    });

    if (!address) {
      return {
        statusCode: 404,
        message: PaymentKeys.ADDRESS_NOT_FOUND,
      };
    }

    const products = cart.products;
    const totalPrice = cart.totalPrice;

    const {currency, cashOnDelivery} = payload;

    if (cashOnDelivery) {
      const payment = await this.paymentRepository.create({
        customerId: customer.id,
        COD: cashOnDelivery,
      });

      const order = await this.createOrder(user);

      // this.generatePDF(order);
      this.generatePdf(order, customer, cart, address);

      return {
        statusCode: 200,
        message: PaymentKeys.PAYMENT_CREATED + 'cashOnDelivery',
        data: {info: 'cashOnDelivery'},
        order,
      };
    }

    const options = {
      amount: totalPrice * 100,
      currency,
      receipt_email: customer.email,
    };

    if (env.PAYMENT_MODE == '1') {
      try {
        const res = await this.razorpay.orders.create(options);

        const payment = await this.paymentRepository.create({
          customerId: customer.id,
          COD: cashOnDelivery,
        });

        const order = await this.createOrder(user);

        return {
          statusCode: 200,
          message: PaymentKeys.PAYMENT_CREATED + 'razorpay',
          data: res,
          order,
        };
      } catch (error) {
        console.error('Razorpay error:', error);
        return {
          statusCode: 500,
          message: 'Error in Razorpay payment',
        };
      }
    }
  }

  // This function is used to create order
  async createOrder(user: UserProfile) {
    // const { user } = req;
    const customer = await this.customerRepository.findOne({
      where: {
        id: user.id,
        isDeleted: false,
      },
    });

    const cart = await this.cartRepository.findOne({
      where: {
        customerId: customer?.id,
        isDeleted: false,
      },
    });
    if (!cart) {
      return {
        statusCode: 404,
        message: PaymentKeys.CART_NOT_FOUND
      };
    }
    const productsfromCart = cart.products;
    let promises = [];
    try {
      promises = await this.getProducts(productsfromCart);
    } catch (err) {
      return {
        statusCode: 404,
        message: PaymentKeys.PRODUCT_NOT_FOUND
      };
    }

    const products = await Promise.all(promises);
    const productIds = this.getProductIds(products);
    const totalPrice = this.calculateTotalPrice(products);
    const totalItems = products.length;

    const payment = await this.paymentRepository.findOne({
      where: {
        customerId: customer?.id,
        isDeleted: false,
      },
    });

    if (!payment) {
      return {
        statusCode: 404,
        message: PaymentKeys.PAYMENT_NOT_FOUND
      };
    }

    let PaymentStatus = 'Paid';
    let PaymentMethod = 'Online';
    if (payment.COD) {
      PaymentMethod = 'cashOnDelivery';
      PaymentStatus = 'pending';
    }
    const address = await this.addressRepository.findOne({
      where: {
        customerId: customer?.id,
        isDeleted: false,
      },
    });
    if (!address) {
      return {
        statusCode: 404,
        message: PaymentKeys.ADDRESS_NOT_FOUND
      };
    }

    const order = await this.orderRepository.create({
      customerId: customer?.id,
      paymentId: payment.id,
      paymentStatus: PaymentStatus,
      paymentMethod: PaymentMethod,
      productIds,
      products: products,
      totalPrice,
      totalItems: totalItems,
    });

    const cartUpdate = await this.cartRepository.updateById(cart.id, {
      isDeleted: true,
    });
    const shippmentstatus = await this.shipmentStatusRepository.create({
      orderId: order.id,
      addressId: address.id,
      status: 'Pending',
    });
    const paymentUpdate = await this.paymentRepository.updateById(payment.id, {
      isDeleted: true,
    });

    return {
      order,
      shippmentstatus,
      payment,
    };
  }

  // Some Fuctions used for calculating total price and getting product details
  async getProducts(products: Array<any>) {
    let productDetails = products.map(async (product) => {
      return await this.productVariantRepository.findOne({
        where: {
          id: product.id,
          isDeleted: false,
        },
      });
    });
    return productDetails;
  }

  getProductIds(products: Array<any>) {
    let productIds = [];
    for (let i = 0; i < products.length; i++) {
      productIds.push(products[i].id);
    }
    return productIds;
  }

  calculateTotalPrice(products: Array<any>) {
    let totalPrice = 0;
    for (let i = 0; i < products.length; i++) {
      totalPrice += products[i].price;
    }
    return totalPrice;
  }

  async savePDFToFile(pdfBuffer: Buffer, filePath: string): Promise<void> {
    const writeFileAsync = promisify(require('fs').writeFile);

    try {
      await writeFileAsync(filePath, pdfBuffer);
      console.log(`PDF saved to: ${filePath}`);
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF');
    }
  }

  async generatePDF(flx: any) {
    const pdfBuffer: Buffer = await new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        bufferPages: true,
      });

      // Customize your PDF document
      flx.order.products.forEach((product: any) => {
        doc.text('Product name : -' + product.name, 100, 100);
        doc.text('Product price : -' + product.price.toString(), 100, 150);
        doc.text('Product color : -' + product.color, 100, 200);
      });

      doc.text('Total Price : -' + flx.order.totalPrice.toString(), 100, 250);
      doc.text('Order Pyment Method : -' + flx.order.paymentMethod, 100, 300);
      doc.text('Payment Status : -' + flx.order.paymentStatus, 100, 350);
      doc.text('Total Items : -' + flx.order.tatalItems.toString(), 100, 400);
      doc.text(
        'Order Time and Date : -' + flx.order.createdAt.toString(),
        100,
        450,
      );

      doc.text(
        'Order Shipment Status : -' + flx.shippmentstatus.status,
        100,
        500,
      );

      doc.text('Cash on Dilevery : -' + flx.payment.COD.toString(), 100, 550);
      doc.text('Payment id  : -' + flx.payment.id, 100, 600);
      doc.text(
        'Payment Time and Date : -' + flx.payment.createdAt.toString(),
        100,
        650,
      );
      doc.end();
      // const buffer = [];
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const data = Buffer.concat(buffers);
        resolve(data);
      });
    });

    // Save the PDF to a file
    await this.savePDFToFile(
      pdfBuffer,
      `./PDFfiles/${Date.now().toString()}.pdf`,
    );
  }

  async generatePdf(
    flx: any,
    customer: any,
    cart: any,
    address: any,
  ): Promise<void> {
    // Load your HTML template
    const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta http-equiv="Content-Style-Type" content="text/css" />
      <title>E-commerce Invoice</title>
      <style type="text/css">
        body {
          font-family: 'Arial', sans-serif;
          font-size: 12pt;
          margin: 0;
          padding: 0;
          background-color: #f3ffe6; /* Lime Background */
        }

        .container {
          width: 80%;
          margin: 20px auto;
          background-color: #ffffff; /* White Container */
          padding: 20px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }

        h1 {
          color: #80ff80; /* Dark Lime */
          text-align: center;
          border-bottom: 2px solid #80ff80;
          padding-bottom: 10px;
        }

        h2 {
          color: #80ff80;
          border-bottom: 1px solid #b3ffb3; /* Lighter Lime */
          padding-bottom: 5px;
          margin-top: 20px;
        }

        p {
          margin: 0;
          line-height: 1.5;
        }

        span {
          font-family: 'Calibri', sans-serif;
          font-size: 9pt;
          color: #333; /* Dark Text Color */
        }

        .lime-text {
          color: #80ff80; /* Dark Lime */
        }

        .lime-bg {
          background-color: #e6ffcc; /* Light Lime Background */
        }

        .lime-border {
          border: 1px solid #80ff80; /* Dark Lime Border */
        }

        .grey-logo {
          fill: #666; /* Grey Color for SVG Logo */
          width: 80px;
          height: 80px;
        }

        .user-details {
          display: flex;
          justify-content: space-between;
        }

        .table-container {
          margin-top: 20px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        table, th, td {
          border: 1px solid #b3ffb3; /* Lighter Lime Border for Table */
        }

        th, td {
          padding: 10px;
          text-align: left;
        }

        .total-section {
          margin-top: 20px;
        }

        .payment-details {
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container lime-bg">
        <h1>E-commerce Invoice</h1>

        <div class="user-details">
          <svg class="grey-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M7 2v11h10V2H7zm11 0v2h2V2h-2zm0 2v4h2V4h-2zm0 4v5h2V8h-2zm-2 8H8v2h8v-2zm2-3v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H2v6h20v-6h-2zm1-3v1h2V8h-2zm0-3v1h2V5h-2zM2 4v1h2V4H2zm0 2v1h2V6H2zm0 2v1h2V8H2zm0 2v1h2v-1H2zm0 2v1h2v-1H2z"/></svg>
          <p class="lime-text">User Details:</p>
        </div>

        <div class="user-details">
          <p><span>{{customer.name}}</span></p>
          <br>
          <p><span>Email:</span> {{customer.email}}</p>
        </div>

        <div class="user-details">
          <p><span>Shipping Address:</span></p>
          <p>{{address.street}}, {{address.city}}, {{address.state}} {{address.zip}} {{address.phone}}</p>
        </div>

        <div class="table-container">
          <h2 class="lime-text">Purchased Products</h2>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {{#cart.products}}
                <tr>
                  <td>{{size}}</td>
                  <td>{{quantity}}</td>
                  <td>{{price}}</td>
                </tr>
              {{/cart.products}}
            </tbody>
          </table>
        </div>

        <div class="total-section lime-border">
          <p><span>Total Items:</span> {{cart.totalItems}}</p>
          <p><span>Total Price:</span> {{cart.totalPrice}}</p>
        </div>

        <div class="payment-details">
          <h2 class="lime-text">Payment Details</h2>
          <p><span>Payment ID:</span> {{payment.id}}</p>
          <p><span>Payment Method:</span> {{order.paymentMethod}}</p>
          <p><span>Payment Status:</span> {{order.paymentStatus}}</p>
          <p><span>Payment Date:</span> {{payment.createdAt}}</p>
        </div>
      </div>
    </body>
    </html>

  `;

    const products = await this.getProducts(cart.products);
    const data = {
      order: flx.order,
      shippmentstatus: flx.shippmentstatus,
      payment: flx.payment,
      products,
      customer,
      cart,
      address,
    };

    // Compile the template
    const compiledTemplate = handlebars.compile(template);

    // Provide data to the template
    const htmlContent = compiledTemplate(data);

    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(htmlContent);

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
    });

    // Save the PDF to a file
    await this.savePDFToFile(
      pdfBuffer,
      `./PDFfiles/${Date.now().toString()}.pdf`,
    );

    // Close the browser
    await browser.close();
  }
}
