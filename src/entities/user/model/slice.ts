import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { UserFormData, UserType } from "../../../shared/types";
import * as userApi from "../api/index";

interface UserState {
  users: UserType[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
};

// 1. Загрузка всех пользователей
export const fetchUsers = createAsyncThunk(
  "user/fetchAll",
  async (_, { rejectWithValue, signal }) => {
    try {
      return await userApi.getUsers(signal);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") throw err;

      const message =
        err instanceof Error ? err.message : "Ошибка загрузки данных.";
      return rejectWithValue(`Ошибка загрузки: ${message}`);
    }
  },
);

// 2. Создание пользователя
export const createUser = createAsyncThunk(
  "user/create",
  async (userData: UserType, { rejectWithValue, signal }) => {
    try {
      const response = await userApi.addUser(userData, signal);
      // Возвращаем данные только если success: true (проверка внутри твоего request)
      return response.data as UserType;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") throw err;

      const message =
        err instanceof Error ? err.message : "Ошибка при создании.";
      return rejectWithValue(`Ошибка сохранения: ${message}`);
    }
  },
);

// 3. Редактирование пользователя
export const editUser = createAsyncThunk(
  "user/update",
  async (
    { id, userData }: { id: string; userData: UserFormData },
    { rejectWithValue, signal },
  ) => {
    try {
      const response = await userApi.updateUser(id, userData, signal);
      return response.data as UserType;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") throw err;

      const message =
        err instanceof Error ? err.message : "Ошибка при обновлении.";
      return rejectWithValue(`Ошибка изменения: ${message}`);
    }
  },
);

// 4. Удаление пользователя
export const deleteUserById = createAsyncThunk(
  "user/delete",
  async (id: string, { rejectWithValue, signal }) => {
    try {
      await userApi.deleteUser(id, signal);
      return id; // Возвращаем ID для фильтрации в редюсере
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") throw err;

      const message =
        err instanceof Error ? err.message : "Ошибка при удалении.";
      return rejectWithValue(`Ошибка удаления: ${message}`);
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) state.users.push(action.payload);
      })
      .addCase(deleteUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(editUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.users.findIndex(
            (u) => u.id === action.payload!.id,
          );
          if (index !== -1) state.users[index] = action.payload;
        }
      })
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string>) => {
          // <--- Добавляем тип здесь
          state.isLoading = false;
          state.error = action.payload; // Теперь TS видит payload как string
        },
      );
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
