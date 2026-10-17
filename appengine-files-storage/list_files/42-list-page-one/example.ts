const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/flatlist";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "prefix": "course-files-1009/",
  "pageNumber": 1,
  "maxKeys": 2,
  "recursive": true,
  "checkPrivacy": true
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
