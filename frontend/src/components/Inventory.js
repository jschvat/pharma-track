/**
 * Inventory Management Component
 *
 * Comprehensive inventory management system for pharmacy operations.
 * Provides real-time inventory tracking, transaction management, and audit functionality
 * with dual-pane layout for inventory items and transaction history register.
 *
 * Key Features:
 * - Real-time inventory display with filtering and search
 * - Transaction processing (prescriptions, returns, expirations, audits)
 * - Transaction history register with checkbook-style display
 * - Low stock and expiration alerts
 * - Responsive design with side-by-side layout on large screens
 * - Complete audit trail with user tracking
 *
 * Technical Details:
 * - Uses React hooks for state management
 * - Integrates with backend inventory and audit APIs
 * - URL parameter management for persistent search state
 * - Custom CSS for scrollable containers and transaction styling
 *
 * @component
 * @author PharmaTraK Development Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  InputGroup,
  Spinner,
  Alert,
  Modal,
  Dropdown,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { inventoryAPI, auditAPI } from "../services/api";
import { useSearchParams } from "react-router-dom";
import { TransactionRegisterRow, TransactionModalRow } from "./TransactionRow";
import DataTable from "./common/DataTable";
import SearchFilterBar from "./common/SearchFilterBar";
import CardHeader from "./common/CardHeader";
import MultiSelectDropdown from "./common/MultiSelectDropdown";
import ActionButtonGroup from "./common/ActionButtonGroup";
import FormField from "./common/FormField";
import FormModal from "./common/FormModal";
import DraggableDialog from "./DraggableDialog";
import {
  PharmaDataGrid,
  InventoryDataGrid,
  PharmaTabs,
  InventoryTabs,
  PharmaForm,
  InventoryForm,
  PharmaDatePicker,
  ExpirationDatePicker,
  PharmaCard,
  PharmaButton,
  PharmaProgressBar,
  InventoryProgress
} from './common/PharmaComponents';
import "../css/components.css";

/**
 * Inventory Component - Main inventory management interface
 *
 * @returns {JSX.Element} The complete inventory management system
 */
const Inventory = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({});
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render mechanism

  // Removed excessive logging
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    active: searchParams.get("active") !== "false",
    low_stock: searchParams.get("filter") === "low_stock",
    expiring: searchParams.get("filter") === "expiring",
  });

  // Transaction Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    quantity: "",
    reason: "",
    prescription_number: "",
    reference_number: "",
    actual_quantity: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  // Transaction History Modal & Sidebar
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' for oldest first, 'desc' for newest first
  const [availablePrescriptions, setAvailablePrescriptions] = useState([]); // Prescriptions that can be returned
  const [sortField, setSortField] = useState("transaction_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [columnFilters, setColumnFilters] = useState({
    transaction_type: [], // Changed to array for multi-select
    performed_by_name: [], // Changed to array for multi-select
    reason: "",
    reference_number: "",
  });

  // Ref to track if component is mounted to prevent duplicate calls
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Load inventory function with proper dependency management
  const loadInventory = useCallback(async () => {
    if (!user?.store_id) {
      // console.log("🚫 No store_id");
      return;
    }

    if (loadingRef.current) {
      // console.log("🚫 Already loading");
      return;
    }

    // console.log("🚀 LOADING INVENTORY for store", user.store_id);
    loadingRef.current = true;
    setLoading(true);
    setError("");
    setInventory([]); // Clear existing inventory first

    try {

      const params = {
        page: 1,
        limit: 100,
        search: filters.search || undefined,
        active: filters.active,
        low_stock: filters.low_stock || undefined,
        expiring: filters.expiring || undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      // Removed excessive logging

      // Use consolidated API call that returns inventory, stats, low stock, and expiring in one call
      const response = await inventoryAPI.getConsolidated(
        user.store_id,
        params
      );

      const data = response.data.data;
      const newInventory = data.inventory || [];
      // console.log("✅ API SUCCESS:", newInventory.length, "items received");

      if (Array.isArray(newInventory) && newInventory.length > 0) {
        // Force state update using functional form to avoid stale closure issues
        setInventory(prevInventory => {
          // console.log("🔄 State update: from", prevInventory.length, "to", newInventory.length, "items");
          return [...newInventory]; // Create new array to trigger re-render
        });
        
        setPagination(data.pagination || {});
        // Force re-render to ensure UI updates
        setForceUpdate(prev => prev + 1);
        // console.log('✅ INVENTORY STATE UPDATED');
      } else {
        // console.log("❌ No inventory items in response");
        setInventory([]);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("❌ API ERROR:", err.message);
        setError(`Failed to load inventory data: ${err.message}`);
        setInventory([]); // Clear any existing inventory on error
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [user?.store_id, filters.search, filters.active, filters.low_stock, filters.expiring]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Monitor inventory state changes
  useEffect(() => {
    // console.log("📊 INVENTORY STATE:", inventory.length, "items");
  }, [inventory]);

  // Cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Helper function to calculate running balance for transactions
  const calculateRunningBalance = (transactions) => {
    // Sort transactions by date and id to ensure proper chronological order
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.transaction_date);
      const dateB = new Date(b.transaction_date);
      if (dateA.getTime() === dateB.getTime()) {
        return a.id - b.id; // Use ID as tiebreaker for same timestamp
      }
      return dateA - dateB; // Oldest first for calculation
    });

    let runningBalance = 0;
    return sortedTransactions.map((transaction) => {
      runningBalance += transaction.quantity_change;
      return {
        ...transaction,
        calculated_running_balance: runningBalance,
      };
    });
  };

  // Helper function to filter, sort and display transactions
  const getSortedTransactions = (transactions) => {
    // First apply filters
    const filteredTransactions = getFilteredTransactions(transactions);
    // Then recalculate running balance for filtered results
    const withRunningBalance = calculateRunningBalance(filteredTransactions);

    // Sort for display based on sortField and sortDirection
    return withRunningBalance.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "transaction_date":
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
          break;
        case "transaction_type":
          aValue = a.transaction_type;
          bValue = b.transaction_type;
          break;
        case "performed_by_name":
          aValue = (a.performed_by_name || "System").toLowerCase();
          bValue = (b.performed_by_name || "System").toLowerCase();
          break;
        case "quantity_change":
          aValue = parseInt(a.quantity_change);
          bValue = parseInt(b.quantity_change);
          break;
        case "quantity_after":
          aValue = parseInt(a.calculated_running_balance || a.quantity_after);
          bValue = parseInt(b.calculated_running_balance || b.quantity_after);
          break;
        default:
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
      }

      if (sortDirection === "asc") {
        if (aValue === bValue) {
          // Use transaction date as tiebreaker, then ID
          const dateA = new Date(a.transaction_date);
          const dateB = new Date(b.transaction_date);
          if (dateA.getTime() === dateB.getTime()) {
            return a.id - b.id;
          }
          return dateA - dateB;
        }
        return aValue > bValue ? 1 : -1;
      } else {
        if (aValue === bValue) {
          // Use transaction date as tiebreaker, then ID
          const dateA = new Date(a.transaction_date);
          const dateB = new Date(b.transaction_date);
          if (dateA.getTime() === dateB.getTime()) {
            return b.id - a.id;
          }
          return dateB - dateA;
        }
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Optimized filter change handler to prevent duplicate API calls
  const handleFilterChange = useCallback(
    (key, value) => {
      setFilters((prevFilters) => {
        const newFilters = { ...prevFilters, [key]: value };

        // Update URL params with the new filter value
        const newParams = new URLSearchParams(searchParams);
        if (value && value !== false) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
        setSearchParams(newParams);

        return newFilters;
      });
    },
    [searchParams, setSearchParams]
  );

  // Helper function to format date (MMM-DD-YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  // Helper function to format time (HH:MM:SS)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  // Helper function to get available prescriptions for return
  const getAvailablePrescriptions = (transactions) => {
    // Get all prescription fills with reference numbers
    const prescriptionFills = transactions.filter(
      (t) =>
        t.transaction_type === "prescription_fill" &&
        t.reference_number &&
        t.quantity_change < 0
    );

    // Get all returns that reference prescription numbers
    const returns = transactions.filter(
      (t) => t.transaction_type === "return_to_stock" && t.reference_number
    );

    // Calculate net quantities for each prescription (fills minus returns)
    const prescriptionMap = new Map();

    prescriptionFills.forEach((fill) => {
      const rxNumber = fill.reference_number;
      const fillQuantity = Math.abs(fill.quantity_change);
      prescriptionMap.set(rxNumber, {
        prescription_number: rxNumber,
        fill_date: fill.transaction_date,
        filled_quantity: fillQuantity,
        returned_quantity: 0,
        available_for_return: fillQuantity,
        filled_by: fill.performed_by_name || "System",
      });
    });

    returns.forEach((returnTx) => {
      const rxNumber = returnTx.reference_number;
      if (prescriptionMap.has(rxNumber)) {
        const prescription = prescriptionMap.get(rxNumber);
        prescription.returned_quantity += returnTx.quantity_change;
        prescription.available_for_return =
          prescription.filled_quantity - prescription.returned_quantity;
      }
    });

    // Return only prescriptions that still have quantity available for return
    return Array.from(prescriptionMap.values()).filter(
      (p) => p.available_for_return > 0
    );
  };

  // Sorting functions for the transaction register table
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (field !== sortField) {
      return "↕️";
    }
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Column filter functions
  const handleColumnFilterChange = (field, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Multi-select filter functions for new dropdown component
  const handleMultiSelectChange = (field) => (selectedValues) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: selectedValues
    }));
  };

  // Convert unique values to dropdown options format
  const getDropdownOptions = (field) => {
    const uniqueValues = getUniqueValues(transactionHistory, field);
    
    return uniqueValues.map(value => ({
      value: value,
      label: field === "transaction_type" 
        ? value.replace("_", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
        : value
    }));
  };

  const clearAllFilters = () => {
    setColumnFilters({
      transaction_type: [], // Clear array
      performed_by_name: [], // Clear array
      reason: "",
      reference_number: "",
    });
  };

  const getFilteredTransactions = (transactions) => {
    return transactions.filter((transaction) => {
      return (
        (columnFilters.transaction_type.length === 0 ||
          columnFilters.transaction_type.includes(transaction.transaction_type)) &&
        (columnFilters.performed_by_name.length === 0 ||
          columnFilters.performed_by_name.includes(transaction.performed_by_name || "System")) &&
        (!columnFilters.reason ||
          (transaction.reason || "")
            .toLowerCase()
            .includes(columnFilters.reason.toLowerCase())) &&
        (!columnFilters.reference_number ||
          (transaction.reference_number || "").includes(
            columnFilters.reference_number
          ))
      );
    });
  };

  const getUniqueValues = (transactions, field) => {
    const values = new Set();
    transactions.forEach((transaction) => {
      let value;
      switch (field) {
        case "transaction_type":
          value = transaction.transaction_type;
          break;
        case "performed_by_name":
          value = transaction.performed_by_name || "System";
          break;
        default:
          return;
      }
      values.add(value);
    });
    return Array.from(values).sort();
  };

  const openTransactionModal = async (type, item) => {
    setModalType(type);
    setSelectedItem(item);

    // Set default values based on transaction type
    const defaultReason = type === "prescription" ? "Prescription fill" : "";

    setTransactionForm({
      quantity: "",
      reason: defaultReason,
      prescription_number: "",
      reference_number: "",
      actual_quantity: type === "audit" ? item.quantity_on_hand : "",
    });

    // Reset validation state
    setValidationErrors({});
    setShowValidationWarning(false);

    // For return transactions, get available prescriptions
    if (type === "return") {
      try {
        const response = await auditAPI.getInventoryHistory(item.id);
        const transactions = response.data.history || [];
        const availableRx = getAvailablePrescriptions(transactions);

        if (availableRx.length === 0) {
          alert(
            "No filled prescriptions available for return. You can only return medications from prescriptions that were previously filled."
          );
          return;
        }

        setAvailablePrescriptions(availableRx);
      } catch (error) {
        console.error("Error loading prescription history:", error);
        alert("Could not load prescription history for returns.");
        return;
      }
    }

    setShowModal(true);
  };

  // Validation function
  const validateForm = () => {
    const errors = {};

    if (modalType === "prescription") {
      if (
        !transactionForm.quantity ||
        transactionForm.quantity === "" ||
        parseInt(transactionForm.quantity) <= 0
      ) {
        errors.quantity = "Quantity is required and must be greater than 0";
      } else if (
        parseInt(transactionForm.quantity) > selectedItem?.quantity_on_hand
      ) {
        errors.quantity = `Cannot exceed available quantity (${selectedItem.quantity_on_hand})`;
      }

      if (
        !transactionForm.prescription_number ||
        transactionForm.prescription_number.trim() === ""
      ) {
        errors.prescription_number = "Prescription number is required";
      }

      if (!transactionForm.reason || transactionForm.reason.trim() === "") {
        errors.reason = "Reason is required";
      }
    } else if (modalType === "return") {
      if (
        !transactionForm.reference_number ||
        transactionForm.reference_number.trim() === ""
      ) {
        errors.reference_number = "Prescription selection is required";
      }

      if (
        !transactionForm.quantity ||
        transactionForm.quantity === "" ||
        parseInt(transactionForm.quantity) <= 0
      ) {
        errors.quantity =
          "Return quantity is required and must be greater than 0";
      }

      if (!transactionForm.reason || transactionForm.reason.trim() === "") {
        errors.reason = "Return reason is required";
      }
    } else if (modalType === "expire") {
      if (
        !transactionForm.quantity ||
        transactionForm.quantity === "" ||
        parseInt(transactionForm.quantity) <= 0
      ) {
        errors.quantity = "Quantity is required and must be greater than 0";
      } else if (
        parseInt(transactionForm.quantity) > selectedItem?.quantity_on_hand
      ) {
        errors.quantity = `Cannot exceed available quantity (${selectedItem.quantity_on_hand})`;
      }

      if (!transactionForm.reason || transactionForm.reason.trim() === "") {
        errors.reason = "Expiration reason is required";
      }
    } else if (modalType === "audit") {
      if (
        !transactionForm.actual_quantity ||
        transactionForm.actual_quantity === "" ||
        parseInt(transactionForm.actual_quantity) < 0
      ) {
        errors.actual_quantity =
          "Valid actual quantity is required (0 or greater)";
      }

      if (!transactionForm.reason || transactionForm.reason.trim() === "") {
        errors.reason = "Audit reason is required";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time validation effect
  useEffect(() => {
    if (showModal && modalType) {
      // Run validation whenever form values change
      validateForm();
    }
  }, [transactionForm, modalType, showModal, selectedItem]);

  // Check if form is valid for button state
  const isFormValid = () => {
    return (
      Object.keys(validationErrors).length === 0 &&
      Object.values(transactionForm).some((value) => value !== "") && // At least one field filled
      modalType
    ); // Modal type is set
  };

  const handleTransaction = async () => {
    if (!selectedItem) return;

    // Validate all required fields
    const isValid = validateForm();
    if (!isValid) {
      setShowValidationWarning(true);
      setError("Please correct the highlighted fields before submitting.");
      return;
    }

    // Clear any previous validation warnings
    setShowValidationWarning(false);
    setValidationErrors({});

    try {
      setLoading(true);
      let response;

      switch (modalType) {
        case "prescription":
          response = await inventoryAPI.fillPrescription(selectedItem.id, {
            quantity: parseInt(transactionForm.quantity),
            prescription_number: transactionForm.prescription_number,
            reason: transactionForm.reason || "Prescription fill",
          });
          break;
        case "return":
          response = await inventoryAPI.returnToStock(selectedItem.id, {
            quantity: parseInt(transactionForm.quantity),
            reason: transactionForm.reason,
            reference_number: transactionForm.reference_number,
          });
          break;
        case "expire":
          response = await inventoryAPI.expire(selectedItem.id, {
            quantity: parseInt(transactionForm.quantity),
            reason: transactionForm.reason,
          });
          break;
        case "audit":
          response = await inventoryAPI.audit(selectedItem.id, {
            actual_quantity: parseInt(transactionForm.actual_quantity),
            reason: transactionForm.reason,
          });
          break;
        default:
          return;
      }

      setShowModal(false);
      loadInventory(); // Reload inventory

      // Only refresh transaction register if it's for the currently viewed drug
      if (selectedDrug && selectedDrug.id === selectedItem.id) {
        // console.log(
        //   "🔄 Refreshing transaction register for current drug:",
        //   selectedDrug.generic_name
        // );
        loadTransactionHistory(selectedItem);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async (item) => {
    try {
      setHistoryLoading(true);
      setSelectedDrug(item);

      // Show register next to the table
      setShowHistorySidebar(true);
      setShowHistoryModal(false);

      // Get transaction history for this inventory item
      const response = await auditAPI.getInventoryHistory(item.id);
      setTransactionHistory(response.data.history || []);
    } catch (err) {
      console.error("Failed to load transaction history:", err);
      setError("Failed to load transaction history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRowClick = (item) => {
    loadTransactionHistory(item);
  };

  const getStockBadge = (item) => {
    if (item.quantity_on_hand <= 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    }
    if (item.quantity_on_hand <= item.reorder_level) {
      return <Badge bg="warning">Low Stock</Badge>;
    }
    return <Badge bg="success">In Stock</Badge>;
  };

  const getExpirationBadge = (expirationDate) => {
    if (!expirationDate) return null;

    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil(
      (expDate - today) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 0) {
      return <Badge bg="danger">Expired</Badge>;
    }
    if (daysUntilExpiration <= 30) {
      return <Badge bg="warning">Expires Soon</Badge>;
    }
    return null;
  };

  // Helper function to get inventory actions
  const getInventoryActions = (item) => [
    {
      type: "custom",
      label: "Fill Rx",
      variant: "primary",
      disabled: item.quantity_on_hand <= 0,
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal("prescription", item);
      },
    },
    {
      type: "custom",
      label: "Return",
      variant: "success",
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal("return", item);
      },
    },
    {
      type: "custom",
      label: "Expire",
      variant: "warning",
      disabled: item.quantity_on_hand <= 0,
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal("expire", item);
      },
    },
    {
      type: "custom",
      label: "Audit",
      variant: "secondary",
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal("audit", item);
      },
    },
  ];

  return (
    <>
      <div className="main-content-container">
        <Container
          fluid
          className={`${showHistorySidebar ? "main-content-expanded" : ""}`}
        >
          {error && (
            <Row className="mb-4">
              <Col>
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              </Col>
            </Row>
          )}

          <SearchFilterBar
            searchPlaceholder="Search drugs..."
            searchValue={filters.search}
            onSearchChange={(value) => handleFilterChange("search", value)}
            filters={[
              {
                key: "active",
                label: "Active Only",
                type: "switch",
                value: filters.active,
                onChange: (value) => handleFilterChange("active", value),
              },
              {
                key: "low_stock",
                label: "Low Stock",
                type: "switch",
                value: filters.low_stock,
                onChange: (value) => handleFilterChange("low_stock", value),
              },
              {
                key: "expiring",
                label: "Expiring",
                type: "switch",
                value: filters.expiring,
                onChange: (value) => handleFilterChange("expiring", value),
              },
            ]}
            additionalActions={
              <Button
                variant="primary"
                onClick={loadInventory}
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : "Refresh"}
              </Button>
            }
          />

          <div className="content-area">
            {/* Main Content Layout - Side by Side */}
            <Row>
              {/* Inventory Table Column */}
              <Col lg={showHistorySidebar ? 6 : 12}>
                <Card className="inventory-card">
                  <CardHeader
                    title={`Inventory Items (${pagination.total || 0})`}
                    subtitle="💡 Click on any row to view transaction history"
                  />
                  <Card.Body>
                    {loading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                      </div>
                    ) : (
                      <div className="inventory-table-container">
                        <div className="table-responsive" key={forceUpdate}>
                          <Table striped hover size="sm">
                            <thead>
                              <tr>
                                <th>Drug</th>
                                <th>NDC</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Unit Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* console.log("🎯 RENDER TABLE:", inventory.length, "items, loading:", loading) */}
                              {inventory.length > 0 ? inventory.map((item) => (
                                <React.Fragment key={item.id}>
                                  <tr
                                    style={{
                                      verticalAlign: "middle",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => handleRowClick(item)}
                                    className="inventory-row"
                                  >
                                    <td>
                                      <div>
                                        <div className="fw-bold small">
                                          {item.generic_name}
                                        </div>
                                        {item.brand_name && (
                                          <div
                                            className="text-muted"
                                            style={{ fontSize: "0.75rem" }}
                                          >
                                            {item.brand_name}
                                          </div>
                                        )}
                                        <div
                                          className="text-muted"
                                          style={{ fontSize: "0.7rem" }}
                                        >
                                          {item.dosage_form} {item.strength}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="small font-monospace">
                                      {item.ndc}
                                    </td>
                                    <td>
                                      <div>
                                        <span className="fw-bold">
                                          {item.quantity_on_hand}
                                        </span>
                                        <div
                                          className="text-muted"
                                          style={{ fontSize: "0.7rem" }}
                                        >
                                          Reorder: {item.reorder_level}
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex flex-column gap-1">
                                        {getStockBadge(item)}
                                        {getExpirationBadge(
                                          item.expiration_date
                                        )}
                                      </div>
                                    </td>
                                    <td className="small">
                                      {item.unit_cost
                                        ? `$${parseFloat(
                                            item.unit_cost
                                          ).toFixed(2)}`
                                        : "N/A"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      colSpan="5"
                                      className="py-1 border-top-0"
                                      style={{ backgroundColor: "#f8f9fa" }}
                                    >
                                      <ActionButtonGroup
                                        actions={getInventoryActions(item)}
                                        size="sm"
                                        className="d-flex gap-1 justify-content-center"
                                      />
                                    </td>
                                  </tr>
                                </React.Fragment>
                              )) : (
                                <tr>
                                  <td colSpan="5" className="text-center py-4 text-muted">
                                    No inventory items found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Transaction Register Column */}
              {showHistorySidebar && (
                <Col 
                  lg={6} 
                  className="d-flex flex-column"
                  style={{ 
                    overflow: "visible", // Allow dropdowns to extend outside
                    position: "relative",
                    zIndex: 1
                  }}
                >
                  <Alert variant="info" className="mb-3 flex-shrink-0">
                    📋 <strong>{selectedDrug?.generic_name}</strong>
                    {selectedDrug?.brand_name &&
                      ` (${selectedDrug.brand_name})`}
                  </Alert>
                  <Card 
                    className="transaction-register flex-grow-1"
                    style={{ 
                      overflow: "visible", // Prevent clipping of dropdowns
                      zIndex: 1, // Lower than dropdowns
                      position: "relative" // Establish positioning context
                    }}
                  >
                    <div className="register-header">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">Transaction Register</h6>
                          <div className="small opacity-75">
                            {selectedDrug?.generic_name}
                            {selectedDrug?.brand_name &&
                              ` (${selectedDrug.brand_name})`}
                          </div>
                        </div>
                        {(columnFilters.transaction_type.length > 0 ||
                          columnFilters.performed_by_name.length > 0 ||
                          columnFilters.reason !== "" ||
                          columnFilters.reference_number !== "") && (
                          <Badge
                            bg="info"
                            className="d-flex align-items-center gap-1"
                          >
                            🔍 Filtered
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 text-white ms-1"
                              onClick={clearAllFilters}
                              style={{ fontSize: "0.8rem" }}
                            >
                              ✕
                            </Button>
                          </Badge>
                        )}
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="btn-group register-sort-buttons"
                            role="group"
                          >
                            <Button
                              variant={
                                sortOrder === "desc"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              size="sm"
                              onClick={() => setSortOrder("desc")}
                              title="Newest first"
                            >
                              📅↓
                            </Button>
                            <Button
                              variant={
                                sortOrder === "asc"
                                  ? "primary"
                                  : "outline-primary"
                              }
                              size="sm"
                              onClick={() => setSortOrder("asc")}
                              title="Oldest first"
                            >
                              📅↑
                            </Button>
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-white p-0"
                            onClick={() => setShowHistorySidebar(false)}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="register-body">
                      <div className="table-responsive h-100">
                        <Table
                          hover
                          size="sm"
                          className="mb-0 register-table"
                          style={{ fontSize: "0.85rem" }}
                        >
                          <thead className="bg-light sticky-top">
                            <tr style={{ borderBottom: "1px solid #dee2e6" }}>
                              <th
                                style={{ cursor: "pointer", minWidth: "110px" }}
                                onClick={() => handleSort("transaction_date")}
                                className="user-select-none"
                              >
                                Date {getSortIcon("transaction_date")}
                              </th>
                              <th
                                style={{ cursor: "pointer", minWidth: "140px" }}
                                onClick={() => handleSort("transaction_type")}
                                className="user-select-none"
                              >
                                Type {getSortIcon("transaction_type")}
                              </th>
                              <th
                                style={{ cursor: "pointer", minWidth: "80px" }}
                                onClick={() => handleSort("performed_by_name")}
                                className="user-select-none"
                              >
                                User {getSortIcon("performed_by_name")}
                              </th>
                              <th style={{ minWidth: "150px" }}>Reason</th>
                              <th style={{ minWidth: "90px" }}>Reference</th>
                              <th
                                style={{
                                  cursor: "pointer",
                                  minWidth: "70px",
                                  textAlign: "right",
                                }}
                                onClick={() => handleSort("quantity_change")}
                                className="user-select-none text-end"
                              >
                                Change {getSortIcon("quantity_change")}
                              </th>
                              <th
                                style={{
                                  cursor: "pointer",
                                  minWidth: "70px",
                                  textAlign: "right",
                                }}
                                onClick={() => handleSort("quantity_after")}
                                className="user-select-none text-end"
                              >
                                Balance {getSortIcon("quantity_after")}
                              </th>
                            </tr>
                            <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                              <th style={{ padding: "4px 8px" }}>
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="p-0 text-muted"
                                  onClick={clearAllFilters}
                                  title="Clear all filters"
                                >
                                  🗑️
                                </Button>
                              </th>
                              <th style={{ padding: "4px 8px" }}>
                                <MultiSelectDropdown
                                  options={getDropdownOptions("transaction_type")}
                                  selectedValues={columnFilters.transaction_type}
                                  onSelectionChange={handleMultiSelectChange("transaction_type")}
                                  placeholder="All Types"
                                  noneSelectedText="All Types"
                                  header="Transaction Types"
                                  minWidth="120px"
                                  maxMenuWidth="220px"
                                  variant="outline-secondary"
                                  size="sm"
                                />
                              </th>
                              <th style={{ padding: "4px 8px" }}>
                                <MultiSelectDropdown
                                  options={getDropdownOptions("performed_by_name")}
                                  selectedValues={columnFilters.performed_by_name}
                                  onSelectionChange={handleMultiSelectChange("performed_by_name")}
                                  placeholder="All Users"
                                  noneSelectedText="All Users"
                                  header="Users"
                                  minWidth="120px"
                                  maxMenuWidth="200px"
                                  variant="outline-secondary"
                                  size="sm"
                                />
                              </th>
                              <th style={{ padding: "4px 8px" }}>
                                <Form.Control
                                  size="sm"
                                  type="text"
                                  placeholder="Filter reason..."
                                  value={columnFilters.reason}
                                  onChange={(e) =>
                                    handleColumnFilterChange(
                                      "reason",
                                      e.target.value
                                    )
                                  }
                                  style={{ fontSize: "0.75rem" }}
                                />
                              </th>
                              <th style={{ padding: "4px 8px" }}>
                                <Form.Control
                                  size="sm"
                                  type="text"
                                  placeholder="Filter ref..."
                                  value={columnFilters.reference_number}
                                  onChange={(e) =>
                                    handleColumnFilterChange(
                                      "reference_number",
                                      e.target.value
                                    )
                                  }
                                  style={{ fontSize: "0.75rem" }}
                                />
                              </th>
                              <th></th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyLoading ? (
                              <tr>
                                <td colSpan="7" className="text-center py-4">
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    variant="primary"
                                  />
                                </td>
                              </tr>
                            ) : transactionHistory.length === 0 ? (
                              <tr>
                                <td
                                  colSpan="7"
                                  className="text-center text-muted py-4"
                                >
                                  No transactions found
                                </td>
                              </tr>
                            ) : (
                              getSortedTransactions(transactionHistory).map(
                                (transaction, index) => (
                                  <TransactionRegisterRow
                                    key={`${transaction.id}-${index}`}
                                    transaction={transaction}
                                    index={index}
                                  />
                                )
                              )
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </div>

          {/* Prescription Fill Dialog - Using DraggableDialog */}
          {modalType === "prescription" && (
            <DraggableDialog
              show={showModal}
              onHide={() => setShowModal(false)}
              title="Fill Prescription"
              width={500}
              height={600}
              footer={
                <>
                  <div className="d-flex justify-content-between align-items-start w-100">
                    <div className="me-3 flex-grow-1">
                      <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        className="me-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleTransaction}
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Validation Errors below buttons */}
                  {(showValidationWarning ||
                    Object.keys(validationErrors).some(
                      (key) => validationErrors[key]
                    )) && (
                    <Alert variant="warning" className="mt-3 mb-0">
                      <Alert.Heading className="h6 mb-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Please correct the following errors:
                      </Alert.Heading>
                      <ul className="mb-0 ps-3">
                        {Object.entries(validationErrors).map(
                          ([field, error]) =>
                            error && (
                              <li key={field} className="small">
                                <strong>
                                  {field
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  :
                                </strong>{" "}
                                {error}
                              </li>
                            )
                        )}
                      </ul>
                    </Alert>
                  )}
                </>
              }
            >
              {selectedItem && (
                <div>
                  <div className="mb-3">
                    <strong>{selectedItem.generic_name}</strong>
                    {selectedItem.brand_name && (
                      <div className="text-muted">
                        {selectedItem.brand_name}
                      </div>
                    )}
                    <div className="small text-muted">
                      Current Stock: {selectedItem.quantity_on_hand}
                    </div>
                  </div>

                  <FormField
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={transactionForm.quantity}
                    onChange={(e) => {
                      setTransactionForm({
                        ...transactionForm,
                        quantity: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.quantity) {
                        setValidationErrors({
                          ...validationErrors,
                          quantity: undefined,
                        });
                      }
                    }}
                    inputProps={{
                      min: 1,
                      max: selectedItem.quantity_on_hand,
                    }}
                    required
                    error={validationErrors.quantity}
                    className={validationErrors.quantity ? "is-invalid" : ""}
                  />

                  <FormField
                    label="Prescription Number"
                    name="prescription_number"
                    value={transactionForm.prescription_number}
                    onChange={(e) => {
                      const prescriptionNumber = e.target.value;
                      const updatedReason = prescriptionNumber
                        ? `Prescription fill - Rx# ${prescriptionNumber}`
                        : "Prescription fill";

                      setTransactionForm({
                        ...transactionForm,
                        prescription_number: prescriptionNumber,
                        reason: updatedReason,
                      });

                      // Clear validation error when user starts typing
                      if (validationErrors.prescription_number) {
                        setValidationErrors({
                          ...validationErrors,
                          prescription_number: undefined,
                        });
                      }
                    }}
                    required
                    placeholder="Enter prescription number (e.g., RX123456)"
                    error={validationErrors.prescription_number}
                    className={
                      validationErrors.prescription_number ? "is-invalid" : ""
                    }
                  />

                  <FormField
                    label="Reason"
                    name="reason"
                    type="textarea"
                    rows={3}
                    value={transactionForm.reason}
                    onChange={(e) => {
                      setTransactionForm({
                        ...transactionForm,
                        reason: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.reason) {
                        setValidationErrors({
                          ...validationErrors,
                          reason: undefined,
                        });
                      }
                    }}
                    required
                    helpText="Reason auto-populated from prescription number. You can edit if needed."
                    error={validationErrors.reason}
                    className={validationErrors.reason ? "is-invalid" : ""}
                  />
                </div>
              )}
            </DraggableDialog>
          )}

          {/* Return to Stock Dialog - Using DraggableDialog */}
          {modalType === "return" && (
            <DraggableDialog
              show={showModal}
              onHide={() => setShowModal(false)}
              title="Return to Stock"
              width={550}
              height={650}
              footer={
                <>
                  <div className="d-flex justify-content-between align-items-start w-100">
                    <div className="me-3 flex-grow-1">
                      <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        className="me-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleTransaction}
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Validation Errors below buttons */}
                  {(showValidationWarning ||
                    Object.keys(validationErrors).some(
                      (key) => validationErrors[key]
                    )) && (
                    <Alert variant="warning" className="mt-3 mb-0">
                      <Alert.Heading className="h6 mb-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Please correct the following errors:
                      </Alert.Heading>
                      <ul className="mb-0 ps-3">
                        {Object.entries(validationErrors).map(
                          ([field, error]) =>
                            error && (
                              <li key={field} className="small">
                                <strong>
                                  {field
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  :
                                </strong>{" "}
                                {error}
                              </li>
                            )
                        )}
                      </ul>
                    </Alert>
                  )}
                </>
              }
            >
              {selectedItem && (
                <div>
                  <div className="mb-3">
                    <strong>{selectedItem.generic_name}</strong>
                    {selectedItem.brand_name && (
                      <div className="text-muted">
                        {selectedItem.brand_name}
                      </div>
                    )}
                    <div className="small text-muted">
                      Current Stock: {selectedItem.quantity_on_hand}
                    </div>
                  </div>

                  {/* Custom Prescription Selector using Bootstrap Dropdown */}
                  <div className="mb-3">
                    <Form.Label>
                      Select Prescription to Return{" "}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant={
                          validationErrors.reference_number
                            ? "outline-danger"
                            : "outline-secondary"
                        }
                        id="prescription-dropdown"
                        className={`w-100 text-start ${
                          validationErrors.reference_number ? "is-invalid" : ""
                        }`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          minHeight: "38px",
                        }}
                      >
                        {transactionForm.reference_number
                          ? (() => {
                              const selectedRx = availablePrescriptions.find(
                                (rx) =>
                                  rx.prescription_number ===
                                  transactionForm.reference_number
                              );
                              return selectedRx ? (
                                <span className="prescription-info">
                                  <span className="rx-bold">
                                    Rx #{selectedRx.prescription_number}
                                  </span>
                                  , {formatDate(selectedRx.fill_date)},{" "}
                                  {formatTime(selectedRx.fill_date)},{" "}
                                  {selectedRx.filled_by || "Unknown"}, qty:{" "}
                                  {selectedRx.available_for_return}
                                </span>
                              ) : (
                                "Choose a prescription..."
                              );
                            })()
                          : "Choose a prescription..."}
                      </Dropdown.Toggle>

                      <Dropdown.Menu
                        className="w-100"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >
                        <Dropdown.Item
                          onClick={() => {
                            setTransactionForm({
                              ...transactionForm,
                              reference_number: "",
                              quantity: "",
                            });
                            if (validationErrors.reference_number) {
                              setValidationErrors({
                                ...validationErrors,
                                reference_number: undefined,
                              });
                            }
                          }}
                          className="text-muted"
                        >
                          Choose a prescription...
                        </Dropdown.Item>
                        {availablePrescriptions.map((rx) => (
                          <Dropdown.Item
                            key={rx.prescription_number}
                            onClick={() => {
                              setTransactionForm({
                                ...transactionForm,
                                reference_number: rx.prescription_number,
                                quantity: rx.available_for_return.toString(),
                              });
                              // Clear validation error when user makes selection
                              if (validationErrors.reference_number) {
                                setValidationErrors({
                                  ...validationErrors,
                                  reference_number: undefined,
                                });
                              }
                            }}
                            active={
                              transactionForm.reference_number ===
                              rx.prescription_number
                            }
                          >
                            <div className="prescription-table">
                              <div className="prescription-row">
                                <div className="prescription-cell rx-number">
                                  Rx #{rx.prescription_number}
                                </div>
                                <div className="prescription-cell date">
                                  {formatDate(rx.fill_date)}
                                </div>
                                <div className="prescription-cell time">
                                  {formatTime(rx.fill_date)}
                                </div>
                                <div className="prescription-cell user">
                                  {rx.filled_by || "Unknown"}
                                </div>
                                <div className="prescription-cell quantity">
                                  Qty: {rx.available_for_return}
                                </div>
                              </div>
                            </div>
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    {validationErrors.reference_number && (
                      <div className="invalid-feedback d-block">
                        {validationErrors.reference_number}
                      </div>
                    )}
                    <Form.Text className="text-muted">
                      Only prescriptions that were previously filled can be
                      returned.
                    </Form.Text>
                  </div>

                  {transactionForm.reference_number && (
                    <FormField
                      label="Return Quantity"
                      name="quantity"
                      type="number"
                      value={transactionForm.quantity}
                      onChange={(e) => {
                        setTransactionForm({
                          ...transactionForm,
                          quantity: e.target.value,
                        });
                        // Clear validation error when user starts typing
                        if (validationErrors.quantity) {
                          setValidationErrors({
                            ...validationErrors,
                            quantity: undefined,
                          });
                        }
                      }}
                      inputProps={{
                        min: 1,
                        max:
                          availablePrescriptions.find(
                            (rx) =>
                              rx.prescription_number ===
                              transactionForm.reference_number
                          )?.available_for_return || 1,
                      }}
                      required
                      helpText={`Maximum returnable: ${
                        availablePrescriptions.find(
                          (rx) =>
                            rx.prescription_number ===
                            transactionForm.reference_number
                        )?.available_for_return || 0
                      } units`}
                      error={validationErrors.quantity}
                      className={validationErrors.quantity ? "is-invalid" : ""}
                    />
                  )}

                  <FormField
                    label="Return Reason"
                    name="reason"
                    type="textarea"
                    rows={3}
                    value={transactionForm.reason}
                    onChange={(e) => {
                      setTransactionForm({
                        ...transactionForm,
                        reason: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.reason) {
                        setValidationErrors({
                          ...validationErrors,
                          reason: undefined,
                        });
                      }
                    }}
                    required
                    helpText="Provide a reason for this return (e.g., patient no longer needs medication, wrong dosage, etc.)"
                    error={validationErrors.reason}
                    className={validationErrors.reason ? "is-invalid" : ""}
                  />
                </div>
              )}
            </DraggableDialog>
          )}

          {/* Expire Medication Dialog - Using DraggableDialog */}
          {modalType === "expire" && (
            <DraggableDialog
              show={showModal}
              onHide={() => setShowModal(false)}
              title="Expire Medication"
              width={480}
              height={520}
              footer={
                <>
                  <div className="d-flex justify-content-between align-items-start w-100">
                    <div className="me-3 flex-grow-1">
                      <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        className="me-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleTransaction}
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Validation Errors below buttons */}
                  {(showValidationWarning ||
                    Object.keys(validationErrors).some(
                      (key) => validationErrors[key]
                    )) && (
                    <Alert variant="warning" className="mt-3 mb-0">
                      <Alert.Heading className="h6 mb-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Please correct the following errors:
                      </Alert.Heading>
                      <ul className="mb-0 ps-3">
                        {Object.entries(validationErrors).map(
                          ([field, error]) =>
                            error && (
                              <li key={field} className="small">
                                <strong>
                                  {field
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  :
                                </strong>{" "}
                                {error}
                              </li>
                            )
                        )}
                      </ul>
                    </Alert>
                  )}
                </>
              }
            >
              {selectedItem && (
                <div>
                  <div className="mb-3">
                    <strong>{selectedItem.generic_name}</strong>
                    {selectedItem.brand_name && (
                      <div className="text-muted">
                        {selectedItem.brand_name}
                      </div>
                    )}
                    <div className="small text-muted">
                      Current Stock: {selectedItem.quantity_on_hand}
                    </div>
                    {selectedItem.expiration_date && (
                      <div className="small text-muted">
                        Expires:{" "}
                        {new Date(
                          selectedItem.expiration_date
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <FormField
                    label="Quantity to Expire"
                    name="quantity"
                    type="number"
                    value={transactionForm.quantity}
                    onChange={(e) => {
                      setTransactionForm({
                        ...transactionForm,
                        quantity: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.quantity) {
                        setValidationErrors({
                          ...validationErrors,
                          quantity: undefined,
                        });
                      }
                    }}
                    inputProps={{
                      min: 1,
                      max: selectedItem.quantity_on_hand,
                    }}
                    required
                    helpText={`Maximum available: ${selectedItem.quantity_on_hand} units`}
                    error={validationErrors.quantity}
                    className={validationErrors.quantity ? "is-invalid" : ""}
                  />

                  <FormField
                    label="Expiration Reason"
                    name="reason"
                    type="textarea"
                    rows={3}
                    value={transactionForm.reason}
                    onChange={(e) => {
                      setTransactionForm({
                        ...transactionForm,
                        reason: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.reason) {
                        setValidationErrors({
                          ...validationErrors,
                          reason: undefined,
                        });
                      }
                    }}
                    required
                    placeholder="e.g., Past expiration date, damaged packaging, etc."
                    helpText="Provide a reason for expiring this medication"
                    error={validationErrors.reason}
                    className={validationErrors.reason ? "is-invalid" : ""}
                  />
                </div>
              )}
            </DraggableDialog>
          )}

          {/* Audit Inventory Dialog - Using DraggableDialog */}
          {modalType === "audit" && (
            <DraggableDialog
              show={showModal}
              onHide={() => setShowModal(false)}
              title="Audit Inventory"
              width={480}
              height={540}
              footer={
                <>
                  <div className="d-flex justify-content-between align-items-start w-100">
                    <div className="me-3 flex-grow-1">
                      <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                        className="me-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleTransaction}
                        disabled={loading || !isFormValid()}
                      >
                        {loading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Validation Errors below buttons */}
                  {(showValidationWarning ||
                    Object.keys(validationErrors).some(
                      (key) => validationErrors[key]
                    )) && (
                    <Alert variant="warning" className="mt-3 mb-0">
                      <Alert.Heading className="h6 mb-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Please correct the following errors:
                      </Alert.Heading>
                      <ul className="mb-0 ps-3">
                        {Object.entries(validationErrors).map(
                          ([field, error]) =>
                            error && (
                              <li key={field} className="small">
                                <strong>
                                  {field
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  :
                                </strong>{" "}
                                {error}
                              </li>
                            )
                        )}
                      </ul>
                    </Alert>
                  )}
                </>
              }
            >
              {selectedItem && (
                <div>
                  <div className="mb-3">
                    <strong>{selectedItem.generic_name}</strong>
                    {selectedItem.brand_name && (
                      <div className="text-muted">
                        {selectedItem.brand_name}
                      </div>
                    )}
                    <div className="small text-muted">
                      Current Stock: {selectedItem.quantity_on_hand}
                    </div>
                    {selectedItem.lot_number && (
                      <div className="small text-muted">
                        Lot: {selectedItem.lot_number}
                      </div>
                    )}
                  </div>

                  <FormField
                    label="Actual Quantity (Physical Count)"
                    name="actual_quantity"
                    type="number"
                    value={transactionForm.actual_quantity}
                    onChange={(e) => {
                      setTransactionForm({
                        ...transactionForm,
                        actual_quantity: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.actual_quantity) {
                        setValidationErrors({
                          ...validationErrors,
                          actual_quantity: undefined,
                        });
                      }
                    }}
                    inputProps={{ min: 0 }}
                    required
                    helpText="Enter the actual counted quantity during physical inventory"
                    error={validationErrors.actual_quantity}
                    className={
                      validationErrors.actual_quantity ? "is-invalid" : ""
                    }
                  />

                  <FormField
                    label="Audit Reason"
                    name="reason"
                    type="textarea"
                    rows={3}
                    value={transactionForm.reason}
                    onChange={(e) => {
                      setTransactionForm({
                        ...transactionForm,
                        reason: e.target.value,
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.reason) {
                        setValidationErrors({
                          ...validationErrors,
                          reason: undefined,
                        });
                      }
                    }}
                    placeholder="Physical inventory count, cycle count, etc."
                    required
                    helpText="Provide a reason for this inventory audit"
                    error={validationErrors.reason}
                    className={validationErrors.reason ? "is-invalid" : ""}
                  />
                </div>
              )}
            </DraggableDialog>
          )}

          {/* Transaction History Modal */}
          <Modal
            show={showHistoryModal}
            onHide={() => setShowHistoryModal(false)}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                Transaction History - {selectedDrug?.generic_name}
                {selectedDrug?.brand_name && ` (${selectedDrug.brand_name})`}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedDrug && (
                <div className="mb-3">
                  <Row>
                    <Col md={6}>
                      <div className="small text-muted">
                        NDC: {selectedDrug.ndc}
                      </div>
                      <div className="small text-muted">
                        Dosage: {selectedDrug.dosage_form}{" "}
                        {selectedDrug.strength}
                      </div>
                      <div className="small text-muted">
                        Manufacturer: {selectedDrug.manufacturer_name}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="small text-muted">
                        Current Stock:{" "}
                        <strong>{selectedDrug.quantity_on_hand}</strong>
                      </div>
                      <div className="small text-muted">
                        Lot: {selectedDrug.lot_number || "N/A"}
                      </div>
                      <div className="small text-muted">
                        Expires:{" "}
                        {selectedDrug.expiration_date
                          ? new Date(
                              selectedDrug.expiration_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {historyLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-2">Loading transaction history...</div>
                </div>
              ) : (
                <div>
                  {transactionHistory.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      No transaction history found for this item.
                    </div>
                  ) : (
                    <div 
                      className="table-responsive"
                      style={{
                        overflowX: "auto",
                        overflowY: "visible", // Allow dropdowns to extend outside
                        position: "relative",
                        zIndex: 1 // Lower z-index than dropdowns
                      }}
                    >
                      <Table striped hover size="sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Running Total</th>
                            <th>Reason</th>
                            <th>User</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactionHistory.map((transaction, index) => (
                            <TransactionModalRow
                              key={index}
                              transaction={transaction}
                              index={index}
                            />
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default Inventory;
