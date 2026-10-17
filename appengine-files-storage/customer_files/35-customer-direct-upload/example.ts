const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/customer/file/upload";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "fileName": "course-order-1009.txt",
  "base64Data": "data:text/plain;base64,VHJhaW5pbmcgY3VzdG9tZXIgYXJ0d29yayByZXF1ZXN0CkNlZGFyIGJvdGFuaWNhbCBwcmludCwgQTMgbWF0dGUuCg=="
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
