import {
  listRequests,
  getRequest,
  createRequestService,
  updateRequestService,
  changeRequestStatus,
  removeRequestService,
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
  const item = await changeRequestStatus(req.params.id, req.body.status);
  res.json({ data: item });
});

export const remove = asyncHandler(async (req, res) => {
  await removeRequestService(req.params.id);
  res.status(204).end();
});
