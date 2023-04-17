import React, {useEffect, useState} from "react";
import {useTable} from 'react-table'
import {Api} from "../utils/Api";
import {User} from "../utils/types";

export function PageAdmin() {

    const [users, setUsers] = useState([] as User[])


    useEffect(() => {
        Api.fetchUsers().then(users => setUsers(users))
    }, [])


    return (<div>
            <h1>Admin</h1>
            <p> NB : Il faut lancer le backend sur localhost:8000 pour faire marcher ce code.</p>

            <div className="card">
                <h2>Users</h2>
                <UsersTable data={users}/>
            </div>


        </div>
    )
}


function UsersTable({data}: { data: User[] }) {

    const columns = React.useMemo(
        () => [
            {
                Header: 'ID',
                accessor: 'id',
            },
            {
                Header: 'Prenom',
                accessor: 'prenom',
            },
            {
                Header: 'Nom',
                accessor: 'nom',
            },
            {
                Header: 'Adresse mail',
                accessor: 'mail',
            },
        ],
        []
    )

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,//@ts-ignore
    } = useTable({columns, data })

    return (
        <div>
            <table {...getTableProps()}>
                <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th
                                {...column.getHeaderProps()}
                                style={{
                                    background: 'aliceblue',
                                    color: 'black',
                                    fontWeight: 'bold',
                                }}
                            >
                                {column.render('Header')}
                            </th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                    prepareRow(row)
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map(cell => {
                                return (
                                    <td
                                        {...cell.getCellProps()}
                                        style={{
                                            padding: '10px',
                                            border: 'solid 1px gray',
                                        }}
                                    >
                                        {cell.render('Cell')}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
                </tbody>
            </table>

        </div>
    )
}
