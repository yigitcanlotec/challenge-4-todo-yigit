import React, { useEffect, useState, useContext, useRef } from 'react';
import axios, { AxiosResponse } from 'axios';
import './homeViews.css';
import Task from '../components/task';
import { ulid } from 'ulid';
import ServerURLContext from '../contexts/ServerURLContext';
import Message from '../components/Message';

type Task = {
  todo_id: string;
  title: string;
  isDone: Boolean;
};

export default function Home() {
  const [taskData, setTaskData] = useState<Task[]>([]);
  const [imagesData, setImagesData] = useState<string[]>();
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
    getTasks(username, token);
    // getImages(username, token);
  };

  const deleteTask = async (
    event: React.ChangeEvent<HTMLInputElement>,
    username,
    todo_id: string
  ) => {
    const result = await axios
      .delete(serverURL + `/api/v1/${username}/${todo_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(async (result) => {
        try {
          await axios.delete(
            serverURL + `/api/v1/${username}/${todo_id}/images`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (error) {}

        if (result.status === 200) {
          getTasks(username, token);

          // getImages(username, token);
          setMessageBox('Başarıyla silindi!');
          errorTimeoutRef.current = setTimeout(() => {
            setMessageBox('');
          }, 2000);
        }
      });
  };

  const handleAddTask = async (
    title: string,
    isDone: boolean,
    username
  ): Promise<void> => {
    const id = ulid();
    const result = await axios.put(
      serverURL + `/api/v1/${username}/task`,
      {
        todo_id: id,
        username: username,
        title: title,
        isDone: isDone,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (result.status === 201) {
      const inputElement = document.getElementById(
        'file-input'
      ) as HTMLInputElement;
      const files = inputElement?.files;

      if (files) {
        await handleFileChange(files, id, username, token);
      }
      setDone(false);
      setTaskTitle('');
      getTasks(username, token).then(() => {
        getImages(username, token);
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

  const getTasks = async (username, token) => {
    const data = await axios
      .get(serverURL + `/api/v1/${username}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((result) => {
        return result.data;
      });
    // setTaskData(data);
    console.log(data);
    axios
      .get(serverURL + `/api/v1/${username}/tasks/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((result) => {
        console.log(result.data);
        const imgID = Object.keys(result.data).map(
          (element) => element.split('/')[1]
        );
      });
  };

  const handleFileChange = async (files, taskId, username, token) => {
    if (files.length > 0) {
      for (const file of files) {
        const postData = {
          fileName: username + '/' + taskId + '/' + file.name,
        };

        await axios
          .post(serverURL + `/api/v1/${username}/${taskId}/images`, postData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then(async (result) => {
            const presignedUrl = result.data;

            try {
              const response = await axios.put(presignedUrl, file, {
                headers: {
                  'Content-Type': file.type,
                },
              });

              if (response.status === 200) {
                setMessageBox('Object uploaded successfuly.');
                errorTimeoutRef.current = setTimeout(() => {
                  setMessageBox('');
                }, 2000);
              } else {
                setMessageBox('Error uploading object');
                errorTimeoutRef.current = setTimeout(() => {
                  setMessageBox('');
                }, 2000);
              }
            } catch (error) {
              setMessageBox('Error uploading object');
              errorTimeoutRef.current = setTimeout(() => {
                setMessageBox('');
              }, 2000);
            }
          })
          .catch((error) => {
            setMessageBox(error);
            errorTimeoutRef.current = setTimeout(() => {
              setMessageBox('');
            }, 2000);
          });
      }
    }
  };

  const getImages = async (user, token) => {
    const result = await axios.get(serverURL + `/api/v1/${user}/tasks/images`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(result);
    if (result.data) {
      const imgID = Object.keys(result.data).map((element) => {
        return element.split('/').slice(1);
      });

      imgID.forEach((element, index) => {
        let todo_id = element[0];

        if (/[0-9]/.test(todo_id.charAt(0))) {
          todo_id = `#\\3${todo_id.charAt(0)} ${todo_id.slice(1)}`;
        } else {
          todo_id = `#${todo_id}`;
        }

        const queryElement = document.querySelector(`${todo_id}`);

        const createImgElement = document.createElement('img');
        createImgElement.id = `img-${element[1]}`;
        createImgElement.width = 30;
        createImgElement.height = 30;
        createImgElement.src =
          (Object.values(result.data)[index] as string) || '';
        // queryElement?.appendChild(createImgElement);
        // console.log(queryElement?.children);
        for (const child of queryElement?.children || []) {
          // console.log(child.id);
          if (document.getElementById(child.id)) continue;
          queryElement?.appendChild(createImgElement);
          // console.log(element[1], ':', child.id);
          // Make sure the element has an id before adding it to the array
        }
      });
    }
  };

  useEffect(() => {
    getTasks(username, token);
    // console.log('Console images:', imagesData);

    // getImages(username, token);

    // getImages(username, token);
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
                  handleImage={imagesData}
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
                onClick={(e) => handleAddTask(taskTitle, isDone, username)}
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
