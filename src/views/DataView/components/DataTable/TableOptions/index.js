import './index.scss';

import {
  Popover,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import OptionsMenu from '@/components/OptionsMenu';

import ColumnConfiguration from './ColumnConfiguration';

const MAX_FULL_EXPORTS_ROWS = 1000;


const TableOptions = ({
  onExportToTsv,
  anchorEl,
  onClose,
  selectionTracker,
  totalRowsSelected,
}) => {
  const [columnControlIsOpen, setColumnControlIsOpen] = useState(false);
  const selectionCount = selectionTracker.getTotalNumOfSelectedRows();

  const menuContents = [
    {
      label: 'Configure Visible Columns',
      handler: () => setColumnControlIsOpen(true),
    },
  ];

  const handleExportAllToTsv = useCallback(() => {
    onExportToTsv(false);
  }, [onExportToTsv]);

  const handleExportSelectionToTsv = useCallback(() => {
    onExportToTsv(true);
  }, [onExportToTsv]);

  if (totalRowsSelected < MAX_FULL_EXPORTS_ROWS) {
    menuContents.push({
      label: 'Export All to TSV',
      handler: handleExportAllToTsv,
    });
  }

  if (selectionCount) {
    menuContents.push({
      label: `Export Selected Rows (${selectionCount}) to TSV`,
      handler: handleExportSelectionToTsv,
    });
  }

  const handleCloseColumnControl = useCallback(() => {
    setColumnControlIsOpen(false);
    onClose();
  }, [onClose]);

  const result = (
    <>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        onClose={onClose}
        open={anchorEl !== null}
      >
        <OptionsMenu
          className="data-view__options-menu"
          options={menuContents}
        />
      </Popover>
      <ColumnConfiguration
        isOpen={columnControlIsOpen}
        onClose={handleCloseColumnControl}
      />
    </>
  );
  return result;
};

TableOptions.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeGroups: PropTypes.arrayOf(PropTypes.string).isRequired,
  allColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  allGroups: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  totalRowsSelected: PropTypes.number.isRequired,
  anchorEl: PropTypes.element,
  getColumnLabel: PropTypes.func,
  onClose: PropTypes.func,
  onExportToTsv: PropTypes.func,
  onToggleColumn: PropTypes.func,
  onToggleGroup: PropTypes.func,
};

TableOptions.defaultProps = {
  onExportToTsv: () => { },
  onToggleColumn: () => { },
  onToggleGroup: () => { },
  getColumnLabel: colId => colId,
  anchorEl: null,
  onClose: () => {},
};


export default TableOptions;
