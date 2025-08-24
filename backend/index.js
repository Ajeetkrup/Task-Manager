import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import express from 'express';
import cors from 'cors';

const tasks = [
  {
    id: "1",
    name: 'Complete project documentation',
    description: 'Write comprehensive API documentation for the new GraphQL endpoints',
    status: "Done",
    timeStamp: "2025-08-23"
  },
  {
    id: "2",
    name: 'Fix authentication bug',
    description: 'Resolve JWT token expiration issue in the login module',
    status: "In Progress",
    timeStamp: "2025-08-24"
  },
  {
    id: "3",
    name: 'Design database schema',
    description: 'Create normalized database structure for user management system',
    status: "Todo",
    timeStamp: "2025-08-24"
  },
  {
    id: "4",
    name: 'Implement payment gateway',
    description: 'Integrate Stripe API for subscription billing functionality',
    status: "In Progress",
    timeStamp: "2025-08-22"
  },
  {
    id: "5",
    name: 'Code review team PRs',
    description: 'Review and approve pending pull requests from development team',
    status: "Todo",
    timeStamp: "2025-08-24"
  }
];

const typeDefs = `#graphql
  type Task {
    id: ID!
    name: String!
    description: String!
    status: String!
    timeStamp: String!
  }

  type Query {
    tasks: [Task!]!
  }

  type DeleteTaskResponse {
    success: Boolean!
    message: String!
    deletedTask: Task
  }

  type Mutation {
    addTask(name: String!, description: String!, status: String!): Task!
    updateTask(id: ID!, name: String, description: String, status: String): Task
    deleteTask(id: ID!): DeleteTaskResponse!
  }
`;

const resolvers = {
  Query: {
    tasks: () => tasks,
  },
  
  Mutation: {
    addTask: (_, { name, description, status }) => {
      const newTask = {
        id: String(tasks.length + 1),
        name,
        description,
        status,  
        timeStamp: new Date().toISOString().split('T')[0]  
      };
      tasks.push(newTask);
      return newTask;
    },
    
    updateTask: (_, { id, name, description, status }) => {
      const index = tasks.findIndex(task => task.id === id);
      if (index === -1) {
        return null; 
      }
      
      if (name !== undefined) tasks[index].name = name;
      if (description !== undefined) tasks[index].description = description;
      if (status !== undefined) tasks[index].status = status;
      
      tasks[index].timeStamp = new Date().toISOString().split('T')[0];
      
      return tasks[index];
    },
    
    deleteTask: (_, { id }) => {
      const index = tasks.findIndex(task => task.id === id);
      if (index === -1) {
        return {
          success: false,
          message: `Task with ID ${id} not found`,
          deletedTask: null
        };
      }
      
      const deletedTask = tasks.splice(index, 1)[0];
      return {
        success: true,
        message: `Task "${deletedTask.name}" deleted successfully`,
        deletedTask
      };
    }
  }
};

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

const allowedOrigins = ['https://task-manager-beryl-mu.vercel.app']

app.use(
  '/graphql',
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'CORS policy: This origin is not allowed.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server)
);

app.get('/', (req, res) => {
  res.send('GraphQL Server is running! Visit /graphql');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 GraphQL Playground available in browser`);
});