import React from 'react';
import { FaBeer, FaReact, FaAccessibleIcon } from 'react-icons/fa';
import { MdAlarm, MdSettings, MdFavorite } from 'react-icons/md';
import { AiFillAccountBook, AiFillAlert, AiFillApi } from 'react-icons/ai';

const iconContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '10px',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  minWidth: '100px',
};

const iconStyle = {
  fontSize: '2em', // アイコンのサイズを調整
  marginBottom: '5px',
};

const IconList = () => {
  const icons = [
    { name: 'FaBeer', component: <FaBeer style={iconStyle} /> },
    { name: 'FaReact', component: <FaReact style={iconStyle} color="skyblue" /> },
    { name: 'FaAccessibleIcon', component: <FaAccessibleIcon style={iconStyle} color="green" /> },
    { name: 'MdAlarm', component: <MdAlarm style={iconStyle} /> },
    { name: 'MdSettings', component: <MdSettings style={iconStyle} color="gray" /> },
    { name: 'MdFavorite', component: <MdFavorite style={iconStyle} color="red" /> },
    { name: 'AiFillAccountBook', component: <AiFillAccountBook style={iconStyle} /> },
    { name: 'AiFillAlert', component: <AiFillAlert style={iconStyle} color="orange" /> },
    { name: 'AiFillApi', component: <AiFillApi style={iconStyle} color="purple" /> },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      {icons.map(icon => (
        <div key={icon.name} style={iconContainerStyle}>
          {icon.component}
          <span>{icon.name}</span>
        </div>
      ))}
    </div>
  );
};

export default IconList;
