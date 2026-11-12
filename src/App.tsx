import Header from './components/Header'
import TasksPage from './pages/TasksPage'

function App() {
  return (
    <>
      <Header />
      <main>
        <p>Mi primera aplicación de gestión de tareas.</p>
        <TasksPage />
      </main>
    </>
  );
}

export default App;