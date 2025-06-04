import React from 'react';
import { useSelector } from 'react-redux';

function Main() {
  const data = useSelector(state => state.data);
  return (
    <div>
      {data.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}

export default Main;