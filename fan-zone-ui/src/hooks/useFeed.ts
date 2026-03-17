import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setFilter as setFilterAction, fetchContent as fetchContentThunk } from '../store/feedSlice';

export function useFeed() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, isLoading, error, filter } = useSelector((state: RootState) => state.feed);

  const setFilter = (newFilter: string) => {
    dispatch(setFilterAction(newFilter));
  };

  const fetchContent = () => {
    dispatch(fetchContentThunk());
  };

  return { items, isLoading, error, filter, setFilter, fetchContent };
}
