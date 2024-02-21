import {injectable, /* inject, */ BindingScope} from '@loopback/core';


@injectable({scope: BindingScope.TRANSIENT})
export class PaymentService {
  constructor(/* Add @inject to inject parameters */) { }

}
