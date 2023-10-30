import React, { useEffect, useState, useContext, useRef } from 'react';
import axios, { AxiosResponse } from 'axios';
import './homeViews.css';
import Task from '../components/task';
import { ulid } from 'ulid';
import ServerURLContext from '../contexts/ServerURLContext';
import Message from '../components/message';

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
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messageBox, setMessageBox] = useState('');

  const handleTaskChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTaskTitle(event.target.value);
  };

  const handleDone = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDone(event.target.checked);
  };

  const markAsDoneOrUndone = async (
    event: React.ChangeEvent<HTMLInputElement>,
    title: string,
    todo_id: string,
    username,
    isDone: Boolean,
    token
  ) => {
    let result: AxiosResponse;
    if (isDone) {
      result = await axios.post(
        serverURL + `/api/v1/${username}/${todo_id}/undone`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } else {
      result = await axios.post(
        serverURL + `/api/v1/${username}/${todo_id}/done`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
    if (result.status === 200) {
      setMessageBox(
        `${title} başarıyla ${
          isDone ? 'yapıldı' : 'yapılmadı'
        } olarak değiştirildi!`
      );
      errorTimeoutRef.current = setTimeout(() => {
        setMessageBox('');
      }, 2000);
    }
    getTasks();
  };

  const deleteTask = async (
    event: React.ChangeEvent<HTMLInputElement>,
    username,
    todo_id: string
  ) => {
    const result = await axios.delete(
      serverURL + `/api/v1/${username}/${todo_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (result.status === 200) {
      getTasks();
      setMessageBox('Başarıyla silindi!');
      errorTimeoutRef.current = setTimeout(() => {
        setMessageBox('');
      }, 2000);
    }
  };

  const handleAddTask = async (param: {
    title: string;
    isDone: boolean;
  }): Promise<void> => {
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
      getTasks().then(() => {
        setMessageBox(result.statusText);
        errorTimeoutRef.current = setTimeout(() => {
          setMessageBox('');
        }, 2000);
      });
    }
  };

  const editTask = async (
    event: React.ChangeEvent<HTMLInputElement>,
    username,
    taskId,
    title: string,
    isDone: Boolean,
    token
  ) => {
    const element = document.getElementById(taskId);

    console.log(element);
    if (element) {
      const newInput = document.createElement('input');
      newInput.className = `input-title`;
      newInput.style.marginLeft = '210px';
      newInput.style.marginTop = '20px';
      newInput.type = 'text';
      newInput.value = title!;
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.appendChild(newInput);
      const spanElement = document.createElement('span');
      spanElement.className = 'material-symbols-outlined';
      spanElement.innerText = 'done';
      spanElement.style.marginLeft = '25px';
      spanElement.onclick = async () => {
        const result = await axios.post(
          serverURL + `/api/v1/${username}/${taskId}/edit`,
          {
            title: newInput.value,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (result.status === 200) {
          window.location.reload();
        }
      };

      element.appendChild(spanElement);
    }
  };

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
                  handleMarkClick={(e) =>
                    markAsDoneOrUndone(
                      e,
                      task.title,
                      task.todo_id,
                      username,
                      task.isDone,
                      token
                    )
                  }
                  handleDelete={(e) => deleteTask(e, username, task.todo_id)}
                  handleEdit={(e) =>
                    editTask(
                      e,
                      username,
                      task.todo_id,
                      task.title,
                      task.isDone,
                      token
                    )
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
        {messageBox && <Message errorMessage={messageBox} />}
      </div>
    </>
  );
}
