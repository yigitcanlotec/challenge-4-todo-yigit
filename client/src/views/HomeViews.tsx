import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './homeViews.css';
import Task from '../components/task';

type Task = {
  todo_id: number;
  title: string;
  isDone: Boolean;
};

export default function Home() {
  const [taskData, setTaskData] = useState<Task[]>([]);

  const getTasks = async () => {
    const username = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const data = await axios
      .get(`http://localhost:3000/api/v1/${username}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((result) => {
        console.log(result.data);
        return result.data;
      });
    setTaskData(data);
  };

  useEffect(() => {
    getTasks();
  }, []);

  return (
    <div className='home-container'>
      <div className='task-container'>
        <div className='tasks'>
          {taskData.map((task) => (
            <div key={task.todo_id}>{task.title}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
