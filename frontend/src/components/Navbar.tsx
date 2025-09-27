import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useWallet } from '../hooks/useWallet';

const navigation = [
  { name: 'Create Circle', href: '/create' },
  { name: 'Browse Circles', href: '/browse' },
  { name: 'My Circles', href: '/my-circles' },
  { name: 'Dashboard', href: '/dashboard' },
];

export default function Navbar() {
  const location = useLocation();
  const { address, balance, connect } = useWallet();

  return (
    <Disclosure as="nav" className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <span className="text-white font-bold text-sm">RG</span>
                  </div>
                  <span className="text-white font-semibold text-xl">ROSCA-Guard</span>
                </Link>
              </div>
              
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === item.href
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden md:block">
                <ConnectButton />
              </div>

              <div className="md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-slate-800 p-2 text-gray-400 hover:bg-slate-700 hover:text-white">
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 bg-slate-800">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-slate-700 hover:text-white"
                >
                  {item.name}
                </Link>
              ))}


              <div className="pt-4 pb-2">
                {address && (
  <div style={{ 
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: '1px solid #475569',
    marginRight: '1rem'
  }}>
    <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>PYUSD Balance</div>
    <div style={{ color: 'white', fontSize: '0.875rem' }}>{balance}</div>
  </div>
)}
                <ConnectButton />
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}