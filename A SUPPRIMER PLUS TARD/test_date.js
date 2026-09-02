const date = new Date("2051-10-26");
const end = new Date("2051-10-30");
console.log("Start:", date.toISOString());
while (date <= end) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  console.log(`${yyyy}-${mm}-${dd} (getDay: ${date.getDay()})`);
  date.setDate(date.getDate() + 1);
}
