import React, { useEffect, useState } from 'react';
import api from '@sms/api-client';
import PageContainer from '../../components/layout/PageContainer';
import { Table } from '@sms/ui-kit';

const TeachersList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers', {
        params: { search, status: 'ACTIVE' }
      });
      setTeachers(res.data.teachers);
    } catch (err) {
      console.error('Failed to load teachers roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [search]);

  const columns = [
    {
      header: 'Employee No',
      accessor: 'employeeNo',
      render: (val) => <span className="font-bold text-indigo-600">{val}</span>
    },
    {
      header: 'Name',
      accessor: (row) => row.user.name
    },
    {
      header: 'Email',
      accessor: (row) => row.user.email
    },
    {
      header: 'Department',
      accessor: 'department'
    }
  ];

  return (
    <PageContainer
      title="Faculty Registry"
      description="View active teacher profiles and departments roster"
    >
      <Table
        columns={columns}
        data={teachers}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No teachers matched your search criteria."
      />
    </PageContainer>
  );
};

export default TeachersList;
