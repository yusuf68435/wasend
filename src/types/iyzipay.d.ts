declare module "iyzipay" {
  interface IyzipayOpts {
    apiKey: string;
    secretKey: string;
    uri: string;
  }
  class Iyzipay {
    constructor(opts: IyzipayOpts);
  }
  export default Iyzipay;
}
