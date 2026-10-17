const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/make-public";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "locations": [
    "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf"
  ]
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
