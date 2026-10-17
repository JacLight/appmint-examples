/** @type {import('next').NextConfig} */
export default {
  // Product images come from wherever the catalog points. A demo should not
  // fail on an unknown host, so images are rendered with a plain <img>.
  reactStrictMode: true,
  async rewrites(){
    const checkout=process.env.CHECKOUT_SERVICE||'http://127.0.0.1:4341';
    return {beforeFiles:[
      {source:'/checkout',destination:checkout+'/'},
      {source:'/return',destination:checkout+'/return'},
      {source:'/api/checkout/:path*',destination:checkout+'/api/:path*'},
    ]};
  },
};
