import React from 'react';
import uuid from 'uuid';
// using redux library
import { createStore, combineReducers } from 'redux';

// each part of reducer function manager a part of state transition
// function reducer(state = {}, action) {
//   return {
//     activeThreadId: activeThreadIdReducer(state.activeThreadId, action),
//     threads: threadsReducer(state.threads, action),
//   };
// }
const reducer = combineReducers({
  activeThreadId: activeThreadIdReducer,
  threads: threadsReducer,
});


function activeThreadIdReducer(state = '1-fca2', action) {
  if (action.type === 'OPEN_THREAD') {
    return action.id;
  } else {
    return state;
  }
}

function threadsReducer(state = [
  {
    id: '1-fca2',
    title: 'Buzz Aldrin',
    messages: messagesReducer(undefined, {}),
  },
  {
    id: '2-be91',
    title: 'Michael Collins',
    messages: messagesReducer(undefined, {}),
  },
], action) {
  if (action.type === 'ADD_MESSAGE') {
    const newMessage = {
      text: action.text,
      timestamp: Date.now(),
      id: uuid.v4(),
    };

    // find thread to concat new message
    // const threadIndex = state.findIndex(
    //   (t) => t.id = action.threadId
    // );
    const threadIndex = findThreadIndex(state, action);

    const oldThread = state[threadIndex];
    const newThread = {
      ...oldThread,
      // messages: oldThread.messages.concat(newMessage),
      messages: messagesReducer(oldThread.messages, action),
    };

    return [
      ...state.slice(0, threadIndex),
      newThread,
      ...state.slice(threadIndex+1, state.length),
    ];
    
  } else if (action.type === 'DELETE_MESSAGE') {
    // find thread to remove the message
    // const threadIndex = state.findIndex(
    //   (t) => t.messages.find((m) => (
    //     m.id === action.id
    //   ))
    // );
    const threadIndex = findThreadIndex(state, action);

    const oldThread = state[threadIndex];

    const newThread = {
      ...oldThread,
      messages: messagesReducer(oldThread.messages, action),
    };

    return [
      ...state.slice(0, threadIndex),
      newThread,
      ...state.slice(
        threadIndex + 1, state.length
      ),
    ];
  } else {
    return state;
  }
}

function messagesReducer(state = [], action) {
  if (action.type === 'ADD_MESSAGE') {
    const newMessage = {
      text: action.text,
      timestamp: Date.now(),
      id: uuid.v4(),
    };
    return state.concat(newMessage);
  } else  if (action.type === 'DELETE_MESSAGE') {
    return state.filter(m => m.id != action.id);
  } else {
    return state;
  }
}

function findThreadIndex(threads, action) {
  switch(action.type) {
    // add message based on the thread id
    case 'ADD_MESSAGE': {
      return threads.findIndex(
        (t) => t.id === action.threadId
      );
    }
    // delete message based on the message id
    // which is stored in action.id
    case 'DELETE_MESSAGE': {
      return threads.findIndex(
        (t) => t.messages.find((m) => (
          m.id === action.id
        ))
      );
    }
  }
}

// const initialState = {
//   activeThreadId: '1-fca2',
//   threads: [
//     {
//       id: '1-fca2',
//       title: 'Buzz Aldrin',
//       messages: [
//         {
//           text: 'Twelve minutes to ignition.',
//           timestamp: Date.now(),
//           id: uuid.v4(),
//         },
//       ],
//     },
//     {
//       id: '2-be91',
//       title: 'Michael Collins',
//       messages: [],
//     },
//     {
//       id: '3-ab23',
//       title: 'Tuan Anh Le',
//       messages: [
//         {
//           text: 'Demo',
//           timestamp: Date.now(),
//           id: uuid.v4(),
//         },
//         {
//           text: 'Demo 2',
//           timestamp: Date.now(),
//           id: uuid.v4(),
//         },
//       ],
//     }
//   ],
// };

// let set initial state in the create store
// const store = createStore(reducer, initialState);
const store = createStore(reducer);

class App extends React.Component {
  componentDidMount() {
    store.subscribe(() => this.forceUpdate());
  }

  render() {
    // get data from store
    // push down information into small component by props
    const state = store.getState();
    const activeThreadId = state.activeThreadId;
    const threads = state.threads;
    const activeThread = threads.find((t) => t.id === activeThreadId);

    // removed since ThreadTabs doesn't need information
    // const tabs = threads.map(t => (
    //   {
    //     title: t.title,
    //     active: t.id === activeThreadId,
    //     id: t.id,
    //   }
    // ));

    return (
      <div className='ui segment'>
        <ThreadTabs />
        <ThreadDisplay thread={activeThread} />
      </div>
    );
  }
}

// convert this component into container component
class ThreadTabs extends React.Component {
  // let component interact directly with store
  // both way (when changing state send by store)
  // or reading state store
  componentDidMount() {
    store.subscribe(() => this.forceUpdate());
  }
  // handleClick = (id) => {
  //   store.dispatch({
  //     type: 'OPEN_THREAD',
  //     id: id,
  //   });
  // };

  // render() {
  //   const tabs = this.props.tabs.map((tab, index) => (
  //     <div
  //       key={index}
  //       className={tab.active ? 'active item' : 'item'}
  //       onClick={() => this.handleClick(tab.id)}
  //     >
  //       {tab.title}
  //     </div>
  //   ));
  //   return (
  //     <div className='ui top attached tabular menu'>
  //       {tabs}
  //     </div>
  //   );
  // }
  render() {
    const state = store.getState();
    const tabs = state.threads.map(t => (
      {
        title: t.title,
        active: t.id === state.activeThreadId,
        id: t.id,
      }
    ));

    return (
      <Tabs 
        tabs = {tabs}
        onClick={(id) => (
          store.dispatch({
            type: 'OPEN_THREAD',
            id: id,
          })
        )}
      />
    )
  };
}

class MessageInput extends React.Component {
  state = {
    value: '',
  };

  onChange = (e) => {
    this.setState({
      value: e.target.value,
    })
  };

  handleSubmit = () => {
    store.dispatch({
      type: 'ADD_MESSAGE',
      text: this.state.value,
      threadId: this.props.threadId,
    });
    this.setState({
      value: '',
    });
  };

  render() {
    return (
      <div className='ui input'>
        <input
          onChange={this.onChange}
          value={this.state.value}
          type='text'
        />
        <button
          onClick={this.handleSubmit}
          className='ui primary button'
          type='submit'
        >
          Submit
        </button>
      </div>
    );
  }
}

class ThreadDisplay extends React.Component {
  handleClick = (id) => {
    store.dispatch({
      type: 'DELETE_MESSAGE',
      id: id,
    });
  };

  render() {
    const messages = this.props.thread.messages.map((message, index) => (
      <div
        className='comment'
        key={index}
        onClick={() => this.handleClick(message.id)}
      >
        <div className='text'>
          {message.text}
          <span className='metadata'>@{message.timestamp}</span>
        </div>
      </div>
    ));
    return (
      <div className='ui center aligned basic segment'>
        <div className='ui comments'>
          {messages}
        </div>
        <MessageInput threadId={this.props.thread.id} />
      </div>
    );
  }
}

// create presentational component
// it gets data from props (sent by container component)
// and use callback function (by props) to send back event
const Tabs = (props) => (
  <div className='ui top attached tabular menu'>
    {
      props.tabs.map((tab, index) => (
        <div
          key={index}
          className={tab.active ? 'active item' : 'item'}
          onClick={() => props.onClick(tab.id)}
        >
        {tab.title}
        </div>
      ))
    }
  </div>
);

export default App;
