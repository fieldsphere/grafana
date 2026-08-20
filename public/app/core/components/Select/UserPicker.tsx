import debounce from 'debounce-promise';
import { isNil } from 'lodash';
import { useMemo, useState } from 'react';

import { type SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { AsyncSelect } from '@grafana/ui';
import { type OrgUser } from 'app/types/user';

import { lookupOrgUsers } from 'app/features/users/api';

export interface Props {
  onSelected: (user: SelectableValue<OrgUser>) => void;
  className?: string;
  inputId?: string;
}

export const UserPicker = ({ className, onSelected, inputId }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const search = useMemo(
    () =>
      debounce(
        async (query?: string) => {
          setIsLoading(true);

          if (isNil(query)) {
            query = '';
          }

          return lookupOrgUsers(query, 100)
            .then((result) => {
              return result.map((user) => ({
                id: user.userId,
                uid: user.uid,
                value: user as OrgUser,
                label: user.login,
                imgUrl: user.avatarUrl,
                login: user.login,
              }));
            })
            .finally(() => {
              setIsLoading(false);
            });
        },
        300,
        { leading: true }
      ),
    []
  );

  return (
    <div className="user-picker" data-testid="userPicker">
      <AsyncSelect
        isClearable
        className={className}
        inputId={inputId}
        isLoading={isLoading}
        defaultOptions={true}
        loadOptions={search}
        onChange={onSelected}
        placeholder={t('user-picker.select-placeholder', 'Start typing to search for user')}
        noOptionsMessage={t('user-picker.noOptionsMessage-no-users-found', 'No users found')}
        aria-label={t('user-picker.select-aria-label', 'User picker')}
      />
    </div>
  );
};
