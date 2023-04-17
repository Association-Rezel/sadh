import { useTable } from 'react-table'
import React from 'react'
 
export default function TestTable() {
  const data = React.useMemo(
    () => [
      {
        prenom: 'Hello',
        nom: 'World',
        adresse: '1234',  
      },
      {
        col1: 'react-table',
        col2: 'rocks',
      },
      {
        col1: 'whatever',
        col2: 'you want',
      },
    ],
    []
  )

  const columns = React.useMemo(
    () => [
      {
        Header: 'Prenom',
        accessor: 'prenom', // accessor is the "key" in the data
      },
      {
        Header: 'Nom',
        accessor: 'nom',
      },
      {
        Header: 'Adresse',
        accessor: 'adresse',
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
          <p> TODO : à merge avec admin pour afficher les users sous forme de table </p>

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
