import mongoose from 'mongoose';
import {userRole} from 'enums/user';
const {ObjectId} = mongoose.Types;

const exampleFilter1 = {
  fields: [{condition: 'equal', value: 1, dataField: 'id'}],
  page: {
    number: 1,
    size: 20,
  },
  sort: '_id',
  projection: ['companyId', 'marketPlaceId', 'apikey', 'apisecretkey'],
};
const exampleFilter2 = {
  fields: [
    {condition: 'equal', value: ['blue', 'red'], dataField: 'color'},
    {condition: 'equal', value: ['16gb', '32gb'], dataField: 'storage'},
    {condition: 'equal', value: 'APPLE', dataField: 'brand'},
  ],
  page: {
    number: 1,
    size: 20,
  },
  searchText: '',
  sort: '_id',
  projection: ['companyId', 'marketPlaceId', 'apikey', 'apisecretkey'],
};

const createConditionObject = (fieldData, value, Model) => {
  const {condition, dataField} = fieldData;
  if (Model.schema?.tree?.[dataField]?.type === Date) value = new Date(value);
  if (Model.schema?.tree?.[dataField]?.type === 'ObjectId') {
    value = ObjectId(value);
  }
  switch (condition) {
    case 'not_null':
      return {$not: {$eq: null}};
    case 'null':
      return {$eq: null};
    case 'contains':
      return {$regex: value, $options: 'gi'};
    case 'does_not_contains':
      return {$not: {$regex: value, $options: 'gi'}};
    case 'equal':
      return {$eq: value};
    case 'not_equal':
      return {$ne: value};
    case 'greater_than':
      return {$gt: value};
    case 'less_than':
      return {$lt: value};
    case 'greater_than_or_equal':
      return {$gte: value};
    case 'less_than_or_equal':
      return {$lte: value};
    case 'starts_with':
      return {$regex: '^' + value + '.*', $options: 'gi'};
    case 'ends_with':
      return {$regex: '.*' + value + '$', $options: 'gi'};
  }
};

export const generateMatchArray = (filter, Model) => {
  if (!filter?.fields) return null;

  const {fields} = filter;
  let returnThis = [];

  fields.forEach((el) => {
    let matchObject = {};
    if (Array.isArray(el.value) && el.value?.length > 1) {
      matchObject.$or = [];
      el.value.forEach((el2) => {
        matchObject.$or.push({[el.dataField]: createConditionObject(el, el2, Model)});
      });
    } else {
      if (Array.isArray(el.value)) el.value = el.value[0];
      matchObject[el.dataField] = createConditionObject(el, el.value, Model);
    }
    console.log('matchObject', matchObject);

    returnThis.push({$match: matchObject});
  });

  return returnThis;
};

export const generateSortObject = (filter) => {
  if (typeof filter?.sort == 'string' && !filter?.sort.startsWith('$')) {
    const {sort} = filter;
    const sortObject = {$sort: {}};
    if (sort.startsWith('-')) sortObject.$sort[sort.substring(1)] = -1;
    else sortObject.$sort[sort] = 1;
    return sortObject;
  }
  return null;
};

export const generateSkipObject = (filter) => {
  if (!isNaN(filter?.page?.size) && !isNaN(filter?.page?.number)) {
    if (filter.page.number > 0) filter.page.number = filter.page.number - 1;
    return {$skip: filter.page.number * filter.page.size};
  }
  return null;
};

export const generateLimitObject = (filter) => {
  if (!isNaN(filter?.page?.size)) {
    return {$limit: filter.page.size};
  }
  return {$limit: 50};
};

export const generateProjectionObject = (user, projectionArray, adminFields) => {
  if (user.role !== userRole.ADMIN) projectionArray = projectionArray.filter((el) => !(adminFields.indexOf(el) >= 0));

  let projectionObject = {};
  projectionArray.forEach((el) => (projectionObject[el] = 1));

  return {$project: projectionObject};
};

/**
 *
 * @param { } user
 * @param { } Model
 * @param {Array} searchTextFields
 * @param {Object} filter
 * @param {Array} defaultProjection
 * @param {Array} adminFields
 * @param {Array} lookupInfos
 */
//db.companies.aggregate([{$limit:5},{$project:{email:1}}, {$unionWith:{ coll: "companies", pipeline: [{$count:"count" }] }} ])
//db.warehouses.aggregate([ {$lookup:{from:"users",  let: { warehouse_id: "$_id" },pipeline:[{$match:{ $expr:{$or:[{wareHouseId:"$$warehouse_id"}] } }}] , as:"users"}}])
export const search = async (user, Model, searchTextFields, filter, defaultProjection, adminFields = [], lookupInfos = []) => {
  let searchText = filter?.searchText || '';
  let projection = filter?.projection || defaultProjection;

  const sortObject = generateSortObject(filter);
  const skipObject = generateSkipObject(filter);
  const limitObject = generateLimitObject(filter);
  const matchObjects = generateMatchArray(filter, Model);
  const projectionObject = generateProjectionObject(user, projection, adminFields);

  console.log('matchObject', matchObjects);

  searchText = searchText.trim() === '' ? [] : searchText.trim().split(' ');

  // const lookupInfo = [
  //   {
  //     from: 'companies',
  //     localField: 'companyId',
  //     foreignField: '_id',
  //     as: 'company',
  //     isSingle: true,
  //   },
  // ];

  // .map((el) => ({
  //   from: el.from,
  //   localField: el.localField,
  //   foreignField: el.foreignField,
  //   as: el.as,
  // }));
  const singleLookupInfos = lookupInfos
    .filter((el) => el.isSingle)
    .map((el) => ({
      from: el.from,
      localField: el.localField,
      foreignField: el.foreignField,
      as: el.as,
    }));
  // .map((el) => ({
  //   from: el.from,
  //   let: {ar: '$' + el.localField},
  //   pipeline: [
  //     {
  //       $match: {
  //         $expr: {
  //           $cond: [{$eq: [{$type: '$$ar'}, 'missing']}, {}, {$eq: ['$' + el.foreignField, '$$ar']}],
  //         },
  //       },
  //     },
  //     {
  //       $limit: 1,
  //     },
  //   ],
  //   as: el.as,
  // }));

  const pluralLookupInfos = lookupInfos
    .filter((el) => !el.isSingle)
    .map((el) => ({
      from: el.from,
      localField: el.localField,
      foreignField: el.foreignField,
      as: el.as,
    }));

  let aggregateArray = [];
  singleLookupInfos.forEach((el) => {
    aggregateArray.push(
      {
        $lookup: el,
      },
      {
        $unwind: {
          path: '$' + el.as,
          preserveNullAndEmptyArrays: true,
        },
      }
    );
  });

  pluralLookupInfos.forEach((el) => {
    aggregateArray.push({$lookup: el});
  });

  console.dir(aggregateArray);

  if (matchObjects) {
    aggregateArray.push(...matchObjects);
  }
  searchText.forEach((el) => {
    const searchArr = [];
    searchTextFields.forEach((el2) => {
      searchArr.push({[el2]: {$regex: el, $options: 'gi'}});
    });
    aggregateArray.push({$match: {$or: searchArr}});
  });

  aggregateArray.push(projectionObject);

  const countAggregateArray = [...matchObjects, {$count: 'count'}];
  if (sortObject) aggregateArray.push(sortObject);
  if (skipObject) aggregateArray.push(skipObject);
  if (limitObject) aggregateArray.push(limitObject);

  let result = await Model.aggregate([{$facet: {totalCount: countAggregateArray, data: aggregateArray}}]).exec();
  result = result[0];
  result.totalCount = result.totalCount[0]?.count || 0;
  console.log('result', result);
  return result;
};
