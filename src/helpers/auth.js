export const generatePublicUser = (item) => {
  if (!item) return item;
  if (item.toObject) item = item.toObject();
  delete item.password;
  return item;
};

export const IsEqualID = (id1, id2) => {
  let equal = false;
  if (JSON.stringify(id1) === JSON.stringify(id2)) equal = true;
  else if (JSON.stringify(id1) === id2) equal = true;
  else if (id1 === JSON.stringify(id2)) equal = true;
  return equal;
};
