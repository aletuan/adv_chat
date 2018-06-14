import React from 'react';
import uuid from 'uuid';
// using redux library
import { createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';

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

// let set initial state in the create store
// const store = createStore(reducer, initialState);
const store = createStore(reducer);

class App extends React.Component {
  render() {
    return (
      <div className='ui segment'>
        <ThreadTabs />
        <ThreadDisplay />
      </div>
    );
  }
}

// used for connect function, then generate
// container component (ThreadTabs)
// mapping function for state
const mapStateToTabsProps = (state) => {
  const tabs = state.threads.map(t => (
    {
      title: t.title,
      active: t.id === state.activeThreadId,
      id: t.id,
    }
  ));

  return {
    tabs,
  };
}

// mapping function for event and handle function
const mapDispatchToTabsProps = (dispatch) => (
  {
    onClick: (id) => (
      dispatch({
        type: 'OPEN_THREAD',
        id: id,
      })
    ),
  }
);

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


// use connect function to generate the container component
const ThreadTabs = connect(
  mapStateToTabsProps,
  mapDispatchToTabsProps
)(Tabs);

const MessageList = (props) => (
  <div className='ui comments'>
    {
      props.messages.map((m, index) => (
        <div
          className='comment'
          key={index}
          onClick={() => props.onClick(m.id)}
        >
        <div className='text'>
          {m.text}
          <span className='metadata'>@{m.timestamp}</span>
        </div>
        </div>
      ))
    }
  </div>
);

class TextFieldSubmit extends React.Component {
  state = {
    value: '',
  };

  onChange = (e) => {
    this.setState({
      value: e.target.value,
    })
  };

  handleSubmit = () => {
    // Since this is presentational component
    // it is no longer communicate with store
    this.props.onSubmit(this.state.value);
    // store.dispatch({
    //   type: 'ADD_MESSAGE',
    //   text: this.state.value,
    //   threadId: this.props.threadId,
    // });
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

const Thread = (props) => (
  <div className='ui center aligned basic segment'>
    <MessageList
      messages={props.thread.messages}
      onClick={props.onMessageClick}
    />
    <TextFieldSubmit
      onSubmit={props.onMessageSubmit}
    />
  </div>
);

const mapStateToThreadProps = (state) => (
  {
    thread: state.threads.find(
      t => t.id === state.activeThreadId
    ),
  }
);

const mapDispatchToThreadProps = (dispatch) => (
  {
    onMessageClick: (id) => (
      dispatch({
        type: 'DELETE_MESSAGE',
        id: id,
      })
    ),
    // kind of expose the dispatch function to
    // megering function
    dispatch: dispatch,
  }
)

const mergeThreadProps = (stateProps, dispatchProps) => (
  {
    ...stateProps,
    ...dispatchProps,
    onMessageSubmit: (text) => (
      dispatchProps.dispatch({
        type: 'ADD_MESSAGE',
        text: text,
        threadId: stateProps.thread.id,
      })
    ),
  }
);

// now using connect to generate ThreadDisplay
const ThreadDisplay = connect(
  mapStateToThreadProps,
  mapDispatchToThreadProps,
  mergeThreadProps
)(Thread);

// export default App;
// let store to be availabe throught the app context
const WrappedApp = () => (
  <Provider store = {store}>
    <App />
  </Provider>
);

export default WrappedApp;
