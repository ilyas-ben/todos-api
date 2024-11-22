import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const portConfig = { port: 7777 };

const sql = postgres({});

const SERVER_ID = crypto.randomUUID();

const handleGetRoot = async (request) => {
    return new Response(`Hello from ${SERVER_ID}`);
};

const handleGetItem = async (request, urlPatternResult) => {
    const id = urlPatternResult.pathname.groups.id;
    const todos = await sql`SELECT * FROM todos WHERE id = ${id}`;

    if (todos.length === 0) {
        return new Response("Not found", { status: 404 });
    }

    return Response.json(todos[0]);
};



const handleGetItems = async (request) => {
    const todos = await sql`SELECT * FROM todos`;
    return Response.json(todos);
};

const handlePostItems = async (request) => {
    try {
        const todo = await request.json();

        // Check if the name property is present and not empty
        if (!todo.item || todo.item.length === 0) {
            return new Response("Item is required", { status: 400 });
        }

        await sql`INSERT INTO todos (item) VALUES (${todo.item})`;
        return new Response("OK", { status: 200 });
    } catch (error) {
        // Catch other types of errors (e.g., JSON parsing errors)
        return new Response("Invalid input", { status: 400 });
    }
};

const handleDeleteItem = async (request, urlPatternResult) => {
    const id = urlPatternResult.pathname.groups.id;
    const result = await sql`DELETE FROM todos WHERE id = ${id}`;

    // Check if any rows were deleted
    if (result.count === 0) {
        return new Response("Not found", { status: 404 });
    }

    return new Response("Deleted successfully", { status: 200 });
};



const urlMapping = [
    
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/todos" }),
        fn: handleGetItems,
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/todos/:id" }),
        fn: handleGetItem,
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/todos" }),
        fn: handlePostItems,
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/" }),
        fn: handleGetRoot,
    },
    {
        method: "DELETE",
        pattern: new URLPattern({ pathname: "/todos/:id" }),
        fn: handleDeleteItem,  // Added handler for DELETE
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
