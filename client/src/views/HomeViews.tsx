import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './homeViews.css';
import Task from '../components/task';
import { ulid } from 'ulid';
import ServerURLContext from '../contexts/ServerURLContext';

type Task = {
  todo_id: string;
  title: string;
  isDone: Boolean;
};

export default function Home() {
  const [taskData, setTaskData] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [isDone, setDone] = useState<boolean>(false);
  const username = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const serverURL = useContext(ServerURLContext);

  const handleTaskChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTaskTitle(event.target.value);
  };

  const handleDone = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDone(event.target.checked);
  };

  const markAsDoneOrUndone = async (
    event: React.ChangeEvent<HTMLInputElement>,
    username,
    isDone,
    token
  ) => {
    let result;
    if (isDone) {
      result = await axios.post(
        serverURL + `/api/v1/${username}/${event.currentTarget.id}/undone`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } else {
      result = await axios.post(
        serverURL + `/api/v1/${username}/${event.currentTarget.id}/done`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
    getTasks();
  };

  async function handleAddTask(param: {
    title: string;
    isDone: boolean;
  }): Promise<void> {
    const id = ulid();
    const result = await axios.put(
      serverURL + `/api/v1/${username}/task`,
      {
        todo_id: id,
        username: username,
        title: param.title,
        isDone: isDone,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (result.status === 201) {
      setDone(false);
      setTaskTitle('');
      getTasks();
    }
  }

  const getTasks = async () => {
    const data = await axios
      .get(serverURL + `/api/v1/${username}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((result) => {
        return result.data;
      });
    setTaskData(data);
  };

  useEffect(() => {
    getTasks();
  }, []);

  return (
    <>
      <div className='top-container'>
        <button id='profile'>{username}</button>
        <button id={'logout'}>Log out</button>
      </div>
      <div className='home-container'>
        <h3>Todo List</h3>
        <div className='task-container'>
          <div className='tasks'>
            {taskData
              .sort((a, b) =>
                (b.todo_id as string).localeCompare(a.todo_id as string)
              )
              .map((task) => (
                <Task
                  key={task.todo_id}
                  taskId={task.todo_id}
                  titleText={task.title}
                  isDone={task.isDone}
                  handleClick={(e) =>
                    markAsDoneOrUndone(e, username, task.isDone, token)
                  }
                />
              ))}
          </div>
          <div className='add-task-container'>
            <input
              type='file'
              name='file-input'
              id='file-input'
              accept='image/png, image/jpg, image/jpeg'
              multiple
            />
            <div className='task-input-container'>
              <input
                type='checkbox'
                name='add-task-done'
                id='add-task-done'
                onChange={handleDone}
                checked={isDone}
              />
              <input
                type='text'
                name='add-task'
                id='add-task'
                onChange={handleTaskChange}
                value={taskTitle}
              />
              <button
                id='add-task-btn'
                onClick={handleAddTask.bind(null, {
                  title: taskTitle,
                  isDone: isDone,
                })}
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
