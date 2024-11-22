import { useContext, useEffect, useState } from "react";
import { Api } from "../../../utils/Api";
import BoxConfigurationPage from "../../../../src/components/Box/BoxConfig"

export default function PageSettings() {
    return (
        <div>
            <BoxConfigurationPage></BoxConfigurationPage>
        </div>
    )
}