import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import * as dotenv from 'dotenv';
import {env} from 'process';
import Razorpay from 'razorpay';
import {AddressRepository, CustomerRepository, OrderRepository, PaymentRepository, ProductRepository, ProductVariantRepository} from '../repositories';
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
    req: any
  ) {
    const {user} = req;

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
  // async buyNow(
  //   payload: {
  //     productVariantId: string,
  //     quantity: number,
  //     cashOnDelivery: boolean,
  //     currency: string;
  //   }, req: any) {
  //   const {user} = req;
  //   const customer = await this.customerRepository.findOne({
  //     where: {
  //       id: user.id,
  //       isDeleted: false,
  //     },
  //   });
  //   if (!customer) {
  //     return {
  //       statusCode: 404,
  //       message: PaymentKeys.CUSTOMER_NOT_FOUND
  //     };
  //   }
  //   const address = await this.addressRepository.findOne({
  //     where: {
  //       customerId: customer.id,
  //       isDeleted: false,
  //     },
  //   });
  //   if (!address) {
  //     return {
  //       statusCode: 404,
  //       message: PaymentKeys.ADDRESS_NOT_FOUND
  //     };
  //   }
  //   const {productVariantId, quantity, cashOnDelivery} = payload;
  //   const productVariant = await this.productVariantRepository.findOne({
  //     where: {
  //       id: productVariantId,
  //       isDeleted: false,
  //     },
  //   });
  //   if (!productVariant) {
  //     return {
  //       statusCode: 404,
  //       message: PaymentKeys.PRODUCT_NOT_FOUND
  //     };
  //   }
  //   const product = await this.productRepository.findOne({
  //     where: {
  //       id: productVariant.productId,
  //       isDeleted: false,
  //     },
  //   });
  //   if (!product) {
  //     return {
  //       statusCode: 404,
  //       message: PaymentKeys.PRODUCT_NOT_FOUND
  //     };
  //   }
  //   const totalPrice = productVariant.price * quantity;
  //   const {currency} = payload;
  //   if (cashOnDelivery) {
  //     const payment = await this.paymentRepository.create({
  //       customerId: customer.id,
  //       COD: cashOnDelivery,
  //     });

  //     const order = await this.orderRepository.create({
  //       customerId: customer.id,
  //       paymentId: payment.id,
  //       paymentStatus: 'Pending',
  //       paymentMethod: 'cashOnDelivery',
  //       productIds: [productVariant.id],
  //       products: [productVariant],
  //       totalPrice,
  //       totalItems: quantity,
  //     });
  //     return {
  //       statusCode: 200,
  //       message: PaymentKeys.PAYMENT_CREATED,
  //       data: {info: 'cashOnDelivery'},
  //       order,
  //     };
  //   }
  //   const options = {
  //     amount: totalPrice * 100,
  //     currency,
  //     receipt: customer.email,
  //   };

  //   if (env.PAYMENT_MODE == '1') {
  //     const res = await this.razorpay.orders.create(options);

  //     const payment = await this.paymentRepository.create({
  //       customerId: customer.id,
  //       // customer: {
  //       //   connect: {id: customer.id},
  //       // },
  //       COD: cashOnDelivery,
  //     });

  //     const order = await this.orderRepository.create({
  //       customerId: customer.id,
  //       paymentId: payment.id,
  //       paymentStatus: 'done',
  //       paymentMethod: 'Online',
  //       productIds: [productVariant.id],
  //       products: [productVariant],
  //       totalPrice,
  //       totalItems: quantity, // Fixed the property name
  //     });
  //     return {
  //       statusCode: 200,
  //       message: PaymentKeys.PAYMENT_CREATED + 'razorpay',
  //       data: res,
  //       order,
  //     };
  //   }

  //   const stripe = new Stripe(env.STRIPE_KEY);
  //   const res = await stripe.checkout.sessions.create({
  //     payment_method_types: ['card'],
  //     line_items: [
  //       {
  //         price_data: {
  //           currency: 'inr',
  //           product_data: {
  //             name: product.name,
  //           },
  //           unit_amount: totalPrice * 100,
  //         },
  //         quantity: 1,
  //       },
  //     ],
  //     mode: 'payment',
  //   });
  //   const payment = await this.paymentRepository.create({
  //     customerId: customer.id,
  //     // customer: {
  //     //   connect: {id: customer.id},
  //     // },
  //     COD: cashOnDelivery,
  //   });

  //   const order = await this.orderRepository.create({
  //     customerId: customer.id,
  //     paymentId: payment.id,
  //     paymentStatus: 'done',
  //     paymentMethod: 'Online',
  //     productIds: [productVariant.id],
  //     products: [productVariant],
  //     totalPrice,
  //     totalItems: quantity,
  //   });
  //   return {
  //     statusCode: 200,
  //     message: PaymentKeys.PAYMENT_CREATED + 'stripe',
  //     data: payment,
  //     order,
  //   };
  // }

}
