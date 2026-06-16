package persist

import "context"

type fakeStore struct {
	values map[string]bool
}

func NewFakeStore() *fakeStore {
	return &fakeStore{values: map[string]bool{}}
}

func (f *fakeStore) GetAll(_ context.Context) (map[string]bool, error) {
	out := make(map[string]bool, len(f.values))
	for key, value := range f.values {
		out[key] = value
	}
	return out, nil
}

func (f *fakeStore) Set(_ context.Context, name string, enabled bool) error {
	f.values[name] = enabled
	return nil
}

func (f *fakeStore) Delete(_ context.Context, name string) error {
	delete(f.values, name)
	return nil
}
