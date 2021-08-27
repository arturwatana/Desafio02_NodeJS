const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(req, res, next) {
   const {username} = req.headers
    const user = users.find((user)=> user.username === username) 
    

    if(!user){

      res.status(404).json({error:'User Not Found!'})

    }else {
      
      req.user = user;

      next()
    }

  

}

function checksCreateTodosUserAvailability(req, res, next) {
  const {user} = req
  const {todos} = user
  
  if(user.pro === false && todos.length <= 9 || user.pro === true){
    
    next()
  } else {

    res.status(403).json({ error: 'Pro Plan required'})
  }

  
 
}

function checksTodoExists(req, res, next) {
  const {id} = req.params;
  const {username} = req.headers;
  const user = users.find((user)=> user.username === username)
  if(user){

  const {todos} = user
  const validateTodo = validate(id)
  if(validateTodo === false){
  res.status(400).json({error:'UUID not valid'})
  }else{
  const foundedToDo = todos.find((todo)=> {return todo.id === id})
  if(!foundedToDo){
    res.status(404).json({error:'To Do not found'})
  }else{
  
   if(!user || !foundedToDo){

    res.status(404).json({error:'To Do not found'})

  }else{
    
  
  req.todo = foundedToDo
  req.user = user
  next()
  }}}
}else{

    res.status(404).json({ error: 'User not found'})
  }
}

function findUserById(req, res, next) {
  const {id} = req.params
  const user = users.find((user)=> {
    
    if(user.id === id){
      console.log(user.id)
      return user
    }})


  if (!user){

    res.status(404).json({error:'User Not Found'})
  }else{

  req.user = user
    next()
  
  }

}

app.post('/users', (req, res) => {
  const { name, username } = req.body;

  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (usernameAlreadyExists) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: []
  };

  users.push(user);

  return res.status(201).json(user);
});

app.get('/users/:id', findUserById, (req, res) => {
  const { user } = req;

  return res.json(user);
});

app.patch('/users/:id/pro', findUserById, (req, res) => {
  const { user } = req;
  
  

  if (user.pro) {
    return res.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return res.json(user);
});

app.get('/todos', checksExistsUserAccount, (req, res) => {
  
  const { user } = req;

  return res.json(user.todos);
});
app.get('/users', (req, res) => {
  
  return res.status(200).json(users);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (req, res) => {
  const { title, deadline } = req.body;
  const { user } = req;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return res.status(201).json(newTodo);
});

app.put('/todos/:id', checksTodoExists, (req, res) => {
  
  const {title, deadline} = req.body
  
  const {todo} = req
  
  if(todo) {

    todo.title = title
    todo.deadline = new Date(deadline)
  }else {
    res.status(404).json({error:'To Do not found'})
  }
    

  return res.json(todo)

});

app.patch('/todos/:id/done', checksTodoExists, (req, res) => {
  const {todo} = req
  console.log(todo)
  if(todo){
    todo.done = true
  } else {
    return res.status(404).json({error:'To Do não encontrada'})
  }

  return res.json(todo)
  
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (req, res) => {
  const { user, todo } = req;

  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  user.todos.splice(todoIndex, 1);

  return res.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};