const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/driver";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = null;
const response: Response = await fetch(base + route, {
  method: "GET", headers,
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
