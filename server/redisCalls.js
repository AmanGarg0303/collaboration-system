import redis from "./redisConnection.js";

const DOC_STATE_KEY = "doc:1:state";
const USERS_KEY = "doc:1:users";

export async function getDocument() {
  return (await redis.get(DOC_STATE_KEY)) || "";
}

export async function setDocument(content) {
  await redis.set(DOC_STATE_KEY, content);
}

export async function addUser(name) {
  return await redis.sadd(USERS_KEY, name);
}

export async function removeUser(name) {
  await redis.srem(USERS_KEY, name);
}

export async function userExists(name) {
  return await redis.sismember(USERS_KEY, name);
}

export async function getMembers() {
  return await redis.smembers(USERS_KEY);
}
