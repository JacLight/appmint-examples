const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/thumbnails";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/cedar-botanical-print.png"
};
const response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
