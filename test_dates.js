const getPeriodsList = () => {
  const list = [];
  const now = new Date('2026-06-11T02:10:47+02:00'); // the metadata time
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    list.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    });
  }
  return list;
};
console.log(getPeriodsList().slice(5, 9));
