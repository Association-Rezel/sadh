import { useState, useEffect } from "react";
import { Order } from "../../utils/types";
import { TableOrders } from "./TableOrders";
import { Api } from "../../utils/Api";

const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        Api.fetchOrders().then((Orders) => setOrders(Orders));
    }, []);

    return (
        <div className="card">
            <h1>Historique des factures</h1>
            <TableOrders rows={orders} />
        </div>
    );
};

export default Orders;
