import { useEffect, useState } from "react";
import { REGIONS, createRegionValue, parseRegionValue } from "../../constants/regions";

// 시/도 + 시/군/구 선택 공통 컴포넌트
export default function RegionSelect({
    value,
    onChange,
    selectClassName = "h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black",
}) {
    const parsedRegion = parseRegionValue(value);
    const [selectedProvince, setSelectedProvince] = useState(parsedRegion.province);
    const district = parsedRegion.district;
    const province = selectedProvince || parsedRegion.province;
    const selectedRegion = REGIONS.find((region) => region.province === province);
    const districts = selectedRegion?.districts || [];

    useEffect(() => {
        setSelectedProvince(parsedRegion.province);
    }, [parsedRegion.province]);

    const handleProvinceChange = (event) => {
        const nextProvince = event.target.value;

        setSelectedProvince(nextProvince);
        onChange(nextProvince);
    };

    const handleDistrictChange = (event) => {
        onChange(createRegionValue(province, event.target.value));
    };

    return (
        <div className="grid gap-2 sm:grid-cols-2">
            <select
                value={province}
                onChange={handleProvinceChange}
                className={selectClassName}
            >
                <option value="">시/도 선택</option>
                {REGIONS.map((region) => (
                    <option key={region.province} value={region.province}>
                        {region.province}
                    </option>
                ))}
            </select>

            <select
                value={district}
                onChange={handleDistrictChange}
                disabled={!province}
                className={selectClassName}
            >
                <option value="">시/군/구 선택</option>
                {districts.map((districtName) => (
                    <option key={districtName} value={districtName}>
                        {districtName}
                    </option>
                ))}
            </select>
        </div>
    );
}
