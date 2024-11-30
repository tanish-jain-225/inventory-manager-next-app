import React from 'react'

const Header = () => {
    return (
        <div>
            <header className="body-font bg-gray-400 p-2">
                <div className="container flex py-2 items-center md:ml-4 mx-auto md:mx-0 w-[98%]">
                    <span className="flex title-font font-medium text-black justify-center items-center p-[4px] mx-auto md:mx-0">
                        <img src="https://cdn-icons-png.flaticon.com/128/7656/7656411.png" alt="logo" width="30px" className='m-2'/>
                        {/* https://cdn-icons-png.flaticon.com/128/7656/7656411.png */}
                        <span className="text-md md:text-lg">Inventory Management System</span>
                    </span>
                </div>
            </header>
        </div>
    )
}

export default Header
