import {
  listRequests,
  getRequest,
  createRequestService,
  updateRequestService,
  changeRequestStatus,
  removeRequestService,
  setAssignees as setAssigneesService,
  removeAssignee as removeAssigneeService,
  getHistory as getHistoryService,
} from '../services/requests.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const result = await listRequests(req.query);
  res.json(result);
});

export const getOne = asyncHandler(async (req, res) => {
  const item = await getRequest(req.params.id);
  res.json({ data: item });
});

export const create = asyncHandler(async (req, res) => {
  const item = await createRequestService(req.body);
  res.status(201).set('Location', `/api/requests/${item.id}`).json({
    data: item,
  });
});

export const update = asyncHandler(async (req, res) => {
  const item = await updateRequestService(req.params.id, req.body);
  res.json({ data: item });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const item = await changeRequestStatus(req.params.id, req.body.status, {
    author: req.body.author,
    comment: req.body.comment,
  });
  res.json({ data: item });
});

export const remove = asyncHandler(async (req, res) => {
  await removeRequestService(req.params.id);
  res.status(204).end();
});

export const setAssignees = asyncHandler(async (req, res) => {
  const item = await setAssigneesService(req.params.id, req.body.assignees);
  res.json({ data: item });
});

export const removeAssignee = asyncHandler(async (req, res) => {
  await removeAssigneeService(req.params.id, req.params.userId);
  res.status(204).end();
});

export const getHistory = asyncHandler(async (req, res) => {
  const data = await getHistoryService(req.params.id);
  res.json({ data });
});
