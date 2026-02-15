import { Provider } from 'react-redux';
import { store } from './app/store';
import { Routes } from './routes';

export function App() {
  return (
    <Provider store={store}>
      <Routes />
    </Provider>
  );
}
