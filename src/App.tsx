import { useEffect, useState } from "react";
import "./App.css";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { UserCard } from "./entities/user";
import {
  createUser,
  deleteUserById,
  editUser as editUserAction,
  fetchUsers,
} from "./entities/user/model/slice";
import { AddUserForm } from "./features/add-user";
import { DeleteUserModal } from "./features/delete-user";
import type { UserFormData, UserType } from "./shared/types";
import { INITIAL_USER_FORM } from "./shared/types";

function App() {
  const dispatch = useAppDispatch();

  // 1. Все данные, статус загрузки и ошибки берем ТОЛЬКО из стора
  const { users, isLoading, error } = useAppSelector((state) => state.user);

  // 2. Локальный стейт оставляем только для UI (формы, модалки)
  const [userForm, setUserForm] = useState<UserFormData>(INITIAL_USER_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  useEffect(() => {
    const promise = dispatch(fetchUsers());
    return () => promise.abort(); // Автоматическая отмена при размонтировании
  }, [dispatch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const finalValue =
      type === "number"
        ? Number(value)
        : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value;
    setUserForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingId) {
      // Редактирование через Redux
      await dispatch(editUserAction({ id: editingId, userData: userForm }));
      setEditingId(null);
    } else {
      // Создание через Redux
      const newUser: UserType = { ...userForm, id: crypto.randomUUID() };
      await dispatch(createUser(newUser));
    }

    setUserForm(INITIAL_USER_FORM);
    setIsAddFormVisible(false);
  };

  const onToggleActive = (id: string) => {
    // Для переключения isActive тоже стоит завести Thunk, если это сохраняется на сервере.
    // Если это только локально — можно оставить editUserAction с частичными данными.
    const user = users.find((u) => u.id === id);
    if (user) {
      dispatch(
        editUserAction({ id, userData: { ...user, isActive: !user.isActive } }),
      );
    }
  };

  const editUser = (id: string) => {
    const selectedUser = users.find((user) => user.id === id);
    if (!selectedUser) return;
    setUserForm({ ...selectedUser });
    setEditingId(id);
    setIsAddFormVisible(false);
  };

  // UI логика модалок и форм
  const cancelEdit = () => {
    setEditingId(null);
    setUserForm(INITIAL_USER_FORM);
  };
  const showAddForm = () => {
    setIsAddFormVisible(true);
    setEditingId(null);
    setUserForm(INITIAL_USER_FORM);
  };
  const hideAddForm = () => {
    setIsAddFormVisible(false);
    setUserForm(INITIAL_USER_FORM);
  };
  const openDeleteModal = (user: UserType) => setUserToDelete(user);
  const closeDeleteModal = () => {
    if (!isLoading) setUserToDelete(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    await dispatch(deleteUserById(userToDelete.id));
    setUserToDelete(null);
  };

  // Показываем лоадер только при первой загрузке (если массив пустой)
  if (isLoading && users.length === 0)
    return <div style={{ color: "green" }}>...Loading</div>;

  return (
    <div>
      <h2>User Management (Redux Toolkit)</h2>

      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <button onClick={showAddForm} className="addUserBtn">
        ➕ Добавить пользователя
      </button>

      <AddUserForm
        userForm={userForm}
        isVisible={isAddFormVisible}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        onCancel={hideAddForm}
        isSubmitting={isLoading} // Используем общий isLoading из Redux
      />

      <div>
        {users.map((user) => (
          <UserCard
            key={user.id}
            userInfo={user.id === editingId ? { ...user, ...userForm } : user}
            isEditing={user.id === editingId}
            handleChange={handleChange}
            removeUser={() => openDeleteModal(user)}
            editUser={() => editUser(user.id)}
            saveUser={handleSubmit}
            cancelEdit={cancelEdit}
            onToggleActive={() => onToggleActive(user.id)}
          />
        ))}
      </div>

      <DeleteUserModal
        isOpen={Boolean(userToDelete)}
        userName={userToDelete?.name ?? ""}
        isDeleting={isLoading}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default App;
