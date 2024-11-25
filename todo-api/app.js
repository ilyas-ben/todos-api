import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import * as todoService from "./services/todoService.js";
import { cacheMethodCalls } from "./util/cacheUtil.js";
import { connect } from "./deps.js";





const portConfig = { port: 7777 };

const sql = postgres({});

const SERVER_ID = crypto.randomUUID();

const cachedTodoService = cacheMethodCalls(todoService, ["addTodo"]);


const handleGetTodo = async (urlPatternResult) => {
    const id = urlPatternResult.pathname.groups.id;
    return Response.json(await cachedTodoService.getTodo(id));
};


const handleGetTodos = async () => {
    return Response.json(await cachedTodoService.getTodos());
};


const handlePostTodos = async (request) => {
    const todo = await request.json();
    await cachedTodoService.addTodo(todo.item);
    return new Response("OK", { status: 200 });
};


const handleDeleteTodo = async (urlPatternResult) => {
    const id = urlPatternResult.pathname.groups.id;
    const result = await sql`DELETE FROM todos WHERE id = ${id}`;
    if (result.count === 0) {
        return new Response("Not found", { status: 404 });
    }

    return new Response("Deleted successfully", { status: 200 });
};

const urlMapping = [

    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/todos" }),
        fn: handleGetTodos,
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/todos/:id" }),
        fn: handleGetTodo,
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/todos" }),
        fn: handlePostTodos,
    },
    {
        method: "DELETE",
        pattern: new URLPattern({ pathname: "/todos/:id" }),
        fn: handleDeleteTodo,
    }
];

const handleRequest = async (request) => {
    const mapping = urlMapping.find(
        (um) => um.method === request.method && um.pattern.test(request.url)
    );

    if (!mapping) {
        return new Response("Not found", { status: 404 });
    }

    const mappingResult = mapping.pattern.exec(request.url);
    try {
        return await mapping.fn(request, mappingResult);
    } catch (e) {
        console.log(e);
        return new Response(e.stack, { status: 500 })
    }

};


Deno.serve(portConfig, handleRequest);
