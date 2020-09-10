import './index.scss';

import { formatDistanceToNow } from 'date-fns';
import React, {
  useContext,
} from 'react';

import QueryResultsTable from '@/components/QueryResultsTable';
import { SecurityContext } from '@/components/SecurityContext';
import { getUser } from '@/services/auth';


const UserProfileView = () => {
  const context = useContext(SecurityContext);
  const user = getUser(context);

  return (
    <div className="user-profile-view">
      <QueryResultsTable
        columnDefs={
          [
            {
              headerName: 'class',
              field: '@class',
              sortable: true,
            },
            {
              headerName: 'relevance',
              field: 'relevance.name',
              sortable: true,
            },
            {
              headerName: 'subject',
              field: 'subject.displayName',
              sortable: true,
            },
            {
              headerName: 'created by',
              field: 'createdBy.name',
              sortable: true,
            },
            {
              headerName: 'created at',
              field: 'createdAt',
              sortable: true,
              valueFormatter: ({ value }) => `${formatDistanceToNow(value)} ago`,
            },
            {
              headerName: 'last updated by',
              field: 'updatedBy.name',
              sortable: true,
            },
            {
              headerName: 'last updated at',
              field: 'updatedAt',
              valueFormatter: ({ value }) => `${formatDistanceToNow(value)} ago`,
            },
            {
              headerName: 'record',
              field: '@rid',
              cellRenderer: 'JumpToRecord',
              sortable: true,
            },
          ]
        }
        description="Statements you have entered or updated"
        queryBody={{
          target: 'Statement',
          filters: [
            {
              OR: [
                { createdBy: user['@rid'] },
                { updatedBy: user['@rid'] },
              ],
            },
          ],
          orderBy: ['createdAt'],
          orderByDirection: 'DESC',
          returnProperties: [
            '@rid', '@class',
            'relevance.name',
            'subject.displayName',
            'createdAt',
            'createdBy.name',
            'updatedAt',
            'updatedBy.name',
          ],
        }}
        title="My Statements"
      />
      <QueryResultsTable
        columnDefs={
          [
            {
              headerName: 'class',
              field: '@class',
              sortable: true,
            },
            {
              headerName: 'name',
              field: 'displayName',
              sortable: true,
            },
            {
              headerName: 'created by',
              field: 'createdBy.name',
              sortable: true,
            },
            {
              headerName: 'created at',
              field: 'createdAt',
              sortable: true,
              valueFormatter: ({ value }) => `${formatDistanceToNow(value)} ago`,
            },
            {
              headerName: 'last updated by',
              field: 'updatedBy.name',
              sortable: true,
            },
            {
              headerName: 'last updated at',
              field: 'updatedAt',
              sortable: true,
              valueFormatter: ({ value }) => `${formatDistanceToNow(value)} ago`,
            },
            {
              headerName: 'record',
              field: '@rid',
              cellRenderer: 'JumpToRecord',
              sortable: true,
            },
          ]
        }
        description="Variants you have entered or updated"
        queryBody={
          {
            target: 'Variant',
            filters: [
              {
                OR: [
                  { createdBy: user['@rid'] },
                  { updatedBy: user['@rid'] },
                ],
              },
            ],
            orderBy: ['createdAt'],
            orderByDirection: 'DESC',
            returnProperties: ['@rid', '@class', 'displayName', 'createdAt', 'createdBy.name', 'updatedAt', 'updatedBy.name'],
          }
        }
        title="My Variants"
      />
    </div>
  );
};


export default UserProfileView;
