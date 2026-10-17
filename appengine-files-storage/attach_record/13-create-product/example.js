const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/create";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "datatype": "sf_product",
  "isNew": true,
  "data": {
    "name": "Cedar Botanical Print \u2014 File API course",
    "sku": "FILES-CEDAR-1009",
    "description": "Harmless training product for file attachment demonstration",
    "status": "draft",
    "price": 12,
    "images": []
  }
};
const response = await fetch(base + route, {
  method: "PUT", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
