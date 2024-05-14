import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import { Separator, TextLink } from "./common";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useTranslation } from "react-i18next";
import { useMarketCoin } from "~/renderer/screens/market/hooks/useMarketCoin";

export default function MarketCrumb() {
  const { t } = useTranslation();
  const history = useHistory();
  const { currency, isLoadingCurrency } = useMarketCoin();
  const goBackToMarket = useCallback(() => {
    setTrackingSource("Page Market Coin - Breadcrumb");
    history.push({
      pathname: `/market`,
    });
  }, [history]);

  return currency ? (
    <>
      <TextLink>
        <Button onClick={goBackToMarket}>{t("market.title")}</Button>
      </TextLink>
      <Separator />
      <Text>{isLoadingCurrency ? "-" : currency.name}</Text>
    </>
  ) : null;
}
