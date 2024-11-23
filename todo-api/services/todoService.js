import { postgres } from "../deps.js";

const sql = postgres({});

const getTodo = async (id) => {
  const items = await sql`SELECT * FROM todos WHERE id = ${id}`;
  return todos[0];
};

const getTodos = async () => {
  return await sql`SELECT * FROM todos`;
};

const addTodo = async (name) => {
  await sql`INSERT INTO todos (item) VALUES (${name})`;
};

export { getTodo, getTodos, addTodo };