import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from 'muicss/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapDispatchToProps from '../../../actions';
import { Avatar } from '../../../../components/Avatar';
import { LoadingAnimation } from '../../../../components/LoadingAnimation';
import {
  TableColumn,
  SearchFilter,
  Pagination
} from '../../../components/Table';
import './styles.scss';

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      totalRows: 0,
      activePage: 1,
      itemsCountPerPage: 10,
      searchFilter: '',
      sort: {
        column: null,
        direction: 'asc'
      },
      dataRows: []
    };
  }
  componentDidUpdate(prevProps) {
    if ( prevProps.isLoading && !this.props.isLoading ) {
      ::this.handleSortTable(this.props.columns[0].key);
    }

    if ( !prevProps.isLoading && prevProps.rows.length !== this.props.rows.length ) {
      const {
        activePage,
        searchFilter,
        sort
      } = this.state;

      ::this.handleDataRowsChange(searchFilter, sort.column, sort.direction, activePage);
    }
  }
  handleDataRowsChange(filter, column, direction, page) {
    const {
      columns,
      rows
    } = this.props;
    const { itemsCountPerPage } = this.state;
    var dataRows = [...rows];
    const lastItemIndex = page * itemsCountPerPage;
    const firstItemIndex = lastItemIndex - itemsCountPerPage;

    if ( filter.length > 0 ) {
      var filteredData = [];

      for (var i = 0; i < dataRows.length; i++) {
        var singleDataRow = dataRows[i];

        for ( var key in singleDataRow ) {
          if (
            columns.some((singleColumn) => singleColumn.key === key) &&
            singleDataRow[key].length > 0 &&
            singleDataRow[key].toLowerCase().match(filter)
          ) {
            filteredData.push(singleDataRow);
            break;
          }
        }
      }

      dataRows = filteredData;
    }

    this.setState({totalRows: dataRows.length});

    dataRows = dataRows.sort((a, b) => {
      var sortKey = a[column].toLowerCase().localeCompare(b[column].toLowerCase());

      return sortKey;
    });

    if ( direction === 'desc' ) {
      dataRows.reverse();
    }

    dataRows = dataRows.slice(firstItemIndex, lastItemIndex);

    this.setState({dataRows: dataRows});
  }
  handleTableRender() {
    const {
      label,
      columns,
      rows,
      isLoading,
      editLink
    } = this.props;
    const {
      totalRows,
      activePage,
      itemsCountPerPage,
      searchFilter,
      sort,
      dataRows
    } = this.state;
    const capitalizeSingularLabel = label.singular.charAt(0).toUpperCase() + label.singular.slice(1);
    const capitalizePluralLabel = label.plural.charAt(0).toUpperCase() + label.plural.slice(1);

    if ( !isLoading ) {
      return (
        <div>
          <div className="search-filter-wrapper">
            <SearchFilter
              onSearchFilterChange={::this.onSearchFilterChange}
              placeholder={"Search " + capitalizePluralLabel}
            />
          </div>
          <div className="table">
            <table className="mui-table mui-table--bordered">
              <thead>
                <tr>
                  {
                    columns.length > 0 &&
                    columns.map((singleColumn, i) =>
                      <TableColumn
                        key={i}
                        columnKey={singleColumn.key}
                        label={singleColumn.label}
                        isSortActive={sort.column === singleColumn.key}
                        sortOrder={sort.direction}
                        handleSortTable={::this.handleSortTable}
                      />
                    )
                  }
                  <th className="actions-column">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  columns.length > 0 &&
                  dataRows.length > 0 &&
                  dataRows.map((singleRow, i) =>
                    <tr key={i} className="table-row">
                      {
                        columns.map((singleColumn, i) =>
                          <td key={i}>
                            <div className="table-data">
                              {
                                i === 0 &&
                                <Avatar
                                  image={singleRow.image}
                                  size="32px"
                                  title={singleRow.name}
                                  accountType={singleRow.accountType}
                                  badgeCloser
                                />
                              }
                              <span>
                                {singleRow[singleColumn.key]}
                              </span>
                            </div>
                          </td>
                        )
                      }
                      <td>
                        <div className="data-actions">
                          {
                            editLink.length > 0 &&
                            <Link
                              to={editLink + "/" + singleRow.id}
                              className="mui-btn mui-btn--small button button-primary"
                              title={"Edit " + capitalizeSingularLabel}
                            >
                              <FontAwesomeIcon icon={["far", "edit"]} />
                            </Link>
                          }
                          <Button
                            className="delete-button"
                            color="danger"
                            size="small"
                            title={"Delete " + capitalizeSingularLabel}
                            onClick={(e) => {::this.handleOpenDeleteModal(e, singleRow)}}
                          >
                            <FontAwesomeIcon icon={["far", "trash-alt"]} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                }
                {
                  searchFilter.length > 0 &&
                  dataRows.length === 0 &&
                  <tr className="no-items-row">
                    <td colSpan={columns.length + 2}>
                      No {label.plural} found
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          {
            totalRows > itemsCountPerPage &&
            <div className="pagination-wrapper">
              <Pagination
                handleChangePage={::this.handleChangePage}
                activePage={activePage}
                totalCount={totalRows}
                itemsCountPerPage={itemsCountPerPage}
              />
            </div>
          }
        </div>
      )
    } else {
      return (
        <LoadingAnimation name="ball-clip-rotate" color="black" />
      )
    }
  }
  onSearchFilterChange(event) {
    const {
      activePage,
      sort
    } = this.state;
    const searchFilter = event.target.value.trim().toLowerCase();

    this.setState({searchFilter: searchFilter});

    ::this.handleDataRowsChange(searchFilter, sort.column, sort.direction, activePage);
  }
  handleSortTable(column) {
    const { rows } = this.props;
    const {
      activePage,
      searchFilter,
      sort
    } = this.state;
    var direction = 'desc';

    if ( sort.column !== null ) {
      if ( sort.column !== column ) {
        direction = 'asc';
      } else {
        if ( sort.direction === 'asc' ) {
          direction = 'desc';
        } else {
          direction = 'asc';
        }
      }
    } else {
      direction = 'asc';
    }

    this.setState({
      sort: {
        column,
        direction
      }
    });

    ::this.handleDataRowsChange(searchFilter, column, direction, activePage);
  }
  handleChangePage(page) {
    const {
      searchFilter,
      sort
    } = this.state;

    this.setState({activePage: page});

    ::this.handleDataRowsChange(searchFilter, sort.column, sort.direction, page);
  }
  handleOpenDeleteModal(event, selecedtRow) {
    event.preventDefault();

    const { handleOpenDeleteModal } = this.props;

    handleOpenDeleteModal(selecedtRow);
  }
  handleCloseDeleteModal() {
    const { handleCloseDeleteModal } = this.props;

    handleCloseDeleteModal();
  }
  render() {
    const {
      modal,
      isDeleteModalOpen
    } = this.props;

    return (
      <div className="table-wrapper">
        {::this.handleTableRender()}
        {
          isDeleteModalOpen &&
          modal
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {}
}

Table.propTypes = {
  label: PropTypes.object,
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  editLink: PropTypes.string,
  modal: PropTypes.element,
  isDeleteModalOpen: PropTypes.bool,
  handleOpenDeleteModal: PropTypes.func,
  handleCloseDeleteModal: PropTypes.func
}

Table.defaultProps = {
  label: {
    singular: 'item',
    plural: 'items'
  },
  isLoading: false,
  editLink: '',
  modal: React.createElement('div'),
  isDeleteModalOpen: false,
  handleOpenDeleteModal: () => {},
  handleCloseDeleteModal: () => {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Table);