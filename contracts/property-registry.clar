;; Property Registry Contract
;; Manages property registration, ownership, and metadata

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-PROPERTY-NOT-FOUND (err u101))
(define-constant ERR-PROPERTY-ALREADY-EXISTS (err u102))
(define-constant ERR-INVALID-SHARES (err u103))
(define-constant ERR-INVALID-VALUE (err u104))
(define-constant ERR-INSUFFICIENT-SHARES (err u105))

;; Data Variables
(define-data-var next-property-id uint u1)

;; Data Maps
(define-map properties
  { property-id: uint }
  {
    address: (string-ascii 200),
    total-value: uint,
    total-shares: uint,
    available-shares: uint,
    minimum-investment: uint,
    owner: principal,
    status: (string-ascii 20),
    created-at: uint
  }
)

(define-map property-shareholders
  { property-id: uint, investor: principal }
  { shares: uint, investment-amount: uint, invested-at: uint }
)

(define-map investor-properties
  { investor: principal }
  { property-ids: (list 100 uint) }
)

;; Read-only functions
(define-read-only (get-property (property-id uint))
  (map-get? properties { property-id: property-id })
)

(define-read-only (get-shareholder-info (property-id uint) (investor principal))
  (map-get? property-shareholders { property-id: property-id, investor: investor })
)

(define-read-only (get-investor-properties (investor principal))
  (default-to { property-ids: (list) } (map-get? investor-properties { investor: investor }))
)

(define-read-only (get-next-property-id)
  (var-get next-property-id)
)

;; Public functions
(define-public (register-property (address (string-ascii 200)) (total-value uint) (total-shares uint) (minimum-investment uint))
  (let
    (
      (property-id (var-get next-property-id))
    )
    (asserts! (> total-value u0) ERR-INVALID-VALUE)
    (asserts! (> total-shares u0) ERR-INVALID-SHARES)
    (asserts! (> minimum-investment u0) ERR-INVALID-VALUE)

    (map-set properties
      { property-id: property-id }
      {
        address: address,
        total-value: total-value,
        total-shares: total-shares,
        available-shares: total-shares,
        minimum-investment: minimum-investment,
        owner: tx-sender,
        status: "active",
        created-at: block-height
      }
    )

    (var-set next-property-id (+ property-id u1))
    (ok property-id)
  )
)

(define-public (purchase-shares (property-id uint) (shares uint))
  (let
    (
      (property (unwrap! (get-property property-id) ERR-PROPERTY-NOT-FOUND))
      (share-price (/ (get total-value property) (get total-shares property)))
      (investment-amount (* shares share-price))
      (current-shares (default-to u0 (get shares (get-shareholder-info property-id tx-sender))))
    )
    (asserts! (>= (get available-shares property) shares) ERR-INSUFFICIENT-SHARES)
    (asserts! (>= investment-amount (get minimum-investment property)) ERR-INVALID-VALUE)

    ;; Update property available shares
    (map-set properties
      { property-id: property-id }
      (merge property { available-shares: (- (get available-shares property) shares) })
    )

    ;; Update shareholder info
    (map-set property-shareholders
      { property-id: property-id, investor: tx-sender }
      {
        shares: (+ current-shares shares),
        investment-amount: (+ (default-to u0 (get investment-amount (get-shareholder-info property-id tx-sender))) investment-amount),
        invested-at: block-height
      }
    )

    ;; Update investor properties list
    (let
      (
        (current-properties (get property-ids (get-investor-properties tx-sender)))
        (updated-properties (if (is-none (index-of current-properties property-id))
                              (unwrap! (as-max-len? (append current-properties property-id) u100) ERR-INVALID-SHARES)
                              current-properties))
      )
      (map-set investor-properties
        { investor: tx-sender }
        { property-ids: updated-properties }
      )
    )

    (ok investment-amount)
  )
)

(define-public (transfer-shares (property-id uint) (recipient principal) (shares uint))
  (let
    (
      (sender-info (unwrap! (get-shareholder-info property-id tx-sender) ERR-PROPERTY-NOT-FOUND))
      (recipient-shares (default-to u0 (get shares (get-shareholder-info property-id recipient))))
      (share-price (/ (get total-value (unwrap! (get-property property-id) ERR-PROPERTY-NOT-FOUND))
                     (get total-shares (unwrap! (get-property property-id) ERR-PROPERTY-NOT-FOUND))))
      (transfer-amount (* shares share-price))
    )
    (asserts! (>= (get shares sender-info) shares) ERR-INSUFFICIENT-SHARES)

    ;; Update sender shares
    (map-set property-shareholders
      { property-id: property-id, investor: tx-sender }
      (merge sender-info {
        shares: (- (get shares sender-info) shares),
        investment-amount: (- (get investment-amount sender-info) transfer-amount)
      })
    )

    ;; Update recipient shares
    (map-set property-shareholders
      { property-id: property-id, investor: recipient }
      {
        shares: (+ recipient-shares shares),
        investment-amount: (+ (default-to u0 (get investment-amount (get-shareholder-info property-id recipient))) transfer-amount),
        invested-at: block-height
      }
    )

    (ok shares)
  )
)
