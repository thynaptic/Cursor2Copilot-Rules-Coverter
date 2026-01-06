#!/usr/bin/env python3
"""Setup configuration for Cursor Rules Converter."""

from setuptools import setup
import os

# Read version from VERSION file
version_file = os.path.join(os.path.dirname(__file__), 'VERSION')
with open(version_file, 'r') as f:
    version = f.read().strip()

# Read long description from README
readme_file = os.path.join(os.path.dirname(__file__), 'README.md')
with open(readme_file, 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='cursor-rules-converter',
    version=version,
    description='Convert Cursor Rules (.mdc files) to VS Code Copilot Instructions',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='Thynaptic',
    author_email='info@thynaptic.com',
    url='https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter',
    project_urls={
        'Bug Reports': 'https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter/issues',
        'Source': 'https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter',
        'Documentation': 'https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter#readme',
    },
    license='MIT',
    packages=[],
    py_modules=['convertmdc'],
    python_requires='>=3.7',
    install_requires=[
        'pyyaml>=5.1',
    ],
    extras_require={
        'dev': [
            'pytest>=6.0',
            'pytest-cov>=2.10',
            'black>=21.0',
            'flake8>=3.8',
        ],
    },
    entry_points={
        'console_scripts': [
            'convertmdc=convertmdc:main',
            'cursor-convert=convertmdc:main',
        ],
    },
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Intended Audience :: Developers',
        'Topic :: Software Development :: Code Generators',
        'Topic :: Text Processing :: Markup',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Operating System :: OS Independent',
        'Environment :: Console',
    ],
    keywords='cursor copilot converter mdc yaml ai code-assistant vscode',
    include_package_data=True,
    zip_safe=False,
)
