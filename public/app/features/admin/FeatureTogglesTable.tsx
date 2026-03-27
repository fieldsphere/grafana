import { useMemo } from 'react';

import { CellProps, Column, InteractiveTable, Stack, Tag, Text, Tooltip } from '@grafana/ui';

import { FeatureFlag } from './state/apis';

type Cell<T extends keyof FeatureFlag = keyof FeatureFlag> = CellProps<FeatureFlag, FeatureFlag[T]>;

interface Props {
  featureToggles: FeatureFlag[];
}

export function FeatureTogglesTable({ featureToggles }: Props) {
  const columns: Array<Column<FeatureFlag>> = useMemo(
    () => [
      {
        id: 'name',
        header: 'Flag',
        cell: ({ cell: { value } }: Cell<'name'>) => (
          <Text element="span" variant="body">
            {value}
          </Text>
        ),
        sortType: 'string',
      },
      {
        id: 'enabled',
        header: 'State',
        cell: ({ cell: { value } }: Cell<'enabled'>) =>
          value ? <Tag name="Enabled" colorIndex={10} /> : <Tag name="Disabled" colorIndex={8} />,
      },
      {
        id: 'stage',
        header: 'Stage',
        cell: ({ cell: { value } }: Cell<'stage'>) => <Tag name={value || 'unknown'} colorIndex={3} />,
        sortType: 'string',
      },
      {
        id: 'description',
        header: 'Description',
        cell: ({ cell: { value } }: Cell<'description'>) => (
          <Text color={value ? 'primary' : 'secondary'}>{value || 'No description available'}</Text>
        ),
      },
      {
        id: 'expression',
        header: 'Default',
        cell: ({ cell: { value } }: Cell<'expression'>) => <Text color="secondary">{value || '-'}</Text>,
      },
      {
        id: 'properties',
        header: 'Properties',
        cell: ({ row: { original } }: Cell) => {
          const tags = [
            original.frontendOnly && 'Frontend only',
            original.requiresDevMode && 'Dev mode',
            original.requiresRestart && 'Restart required',
          ].filter(Boolean);

          if (!tags.length) {
            return <Text color="secondary">-</Text>;
          }

          return (
            <Stack wrap gap={1}>
              {tags.map((tag) => (
                <Tooltip key={tag} content={tag}>
                  <Tag name={tag} colorIndex={5} />
                </Tooltip>
              ))}
            </Stack>
          );
        },
      },
    ],
    []
  );

  return <InteractiveTable columns={columns} data={featureToggles} getRowId={(row) => row.name} />;
}
