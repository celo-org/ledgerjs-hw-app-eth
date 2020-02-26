// @flow
import React, { useState, useCallback, useMemo, useRef, memo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  SafeAreaView,
} from "react-native";
import { distribute } from "@ledgerhq/live-common/lib/apps";
import type { Action, State, App } from "@ledgerhq/live-common/lib/apps";
import { useAppsSections } from "@ledgerhq/live-common/lib/apps/react";

import { TabView, TabBar } from "react-native-tab-view";
import Animated from "react-native-reanimated";

import i18next from "i18next";
import { Trans } from "react-i18next";

import colors from "../../colors";

import SearchModal from "./Modals/SearchModal";
import AppFilter from "./AppsList/AppFilter";
import UninstallAllButton from "./AppsList/UninstallAllButton";

import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import { track } from "../../analytics";

import DeviceCard from "./Device";
import AppsList from "./AppsList";
import AppUpdateAll from "./AppsList/AppUpdateAll";

import InstallProgressBar from "./AppsList/InstallProgressBar";

const { interpolate, Extrapolate } = Animated;
const { width, height } = Dimensions.get("screen");
const initialLayout = { width, height };

type Props = {
  state: State,
  dispatch: Action => void,
  currentProgress: *,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
  setStorageWarning: () => void,
  managerTabs: *,
  deviceId: string,
  initialDeviceName: string,
  navigation: *,
  blockNavigation: boolean,
  deviceInfo: *,
};

const AppsScreen = ({
  state,
  dispatch,
  currentProgress,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  setStorageWarning,
  managerTabs,
  deviceId,
  initialDeviceName,
  navigation,
  blockNavigation,
  deviceInfo,
}: Props) => {
  const distribution = distribute(state);

  const listRef = useRef();

  const [index, setIndex] = useState(0);
  const [routes] = React.useState([
    {
      key: managerTabs.CATALOG,
      title: i18next.t("manager.appsCatalog"),
    },
    {
      key: managerTabs.INSTALLED_APPS,
      title: i18next.t("manager.installedApps"),
      notif: null,
    },
  ]);

  const [appFilter, setFilter] = useState("all");
  const [sort, setSort] = useState("marketcap");
  const [order, setOrder] = useState("desc");

  const [position] = useState(() => new Animated.Value(0));

  const searchOpacity = interpolate(position, {
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: Extrapolate.CLAMP,
  });

  const [scrollY, setScrollY] = useState(0);

  const onScroll = useCallback(
    evt => setScrollY(evt.nativeEvent.contentOffset.y),
    [setScrollY],
  );

  const scrollToTop = useCallback(() => {
    if (scrollY > 280)
      setTimeout(() => {
        if (listRef.current && listRef.current.scrollToIndex)
          listRef.current.scrollToIndex({ index: 1 });
      }, 100);
  }, [scrollY]);

  const jumpTo = useCallback(
    key => {
      track("ManagerTabBarClick", { tab: key });
      setIndex(key === managerTabs.CATALOG ? 0 : 1);
      scrollToTop();
    },
    [managerTabs.CATALOG, scrollToTop],
  );

  const onIndexChange = useCallback(
    index => {
      track("ManagerTabSwipe", {
        tab: index === 0 ? managerTabs.CATALOG : managerTabs.INSTALLED_APPS,
      });
      setIndex(index);
      scrollToTop();
    },
    [managerTabs.CATALOG, managerTabs.INSTALLED_APPS, scrollToTop],
  );

  const onUninstallAll = useCallback(() => dispatch({ type: "wipe" }), [
    dispatch,
  ]);

  const sortOptions = useMemo(
    () => ({
      type: sort,
      order,
    }),
    [sort, order],
  );

  const { update, device, catalog } = useAppsSections(state, {
    query: "",
    appFilter,
    sort: sortOptions,
  });

  const renderNoResults = useCallback(
    () => (
      <Touchable
        onPress={() => setIndex(0)}
        activeOpacity={0.5}
        style={styles.noAppInstalledContainer}
        event="ManagerNoAppsInstalledClick"
      >
        <LText bold style={styles.noAppInstalledText}>
          <Trans i18nKey="manager.appList.noAppsInstalled" />
        </LText>
        <LText style={styles.noAppInstalledDescription}>
          <Trans i18nKey="manager.appList.noAppsDescription" />
        </LText>
      </Touchable>
    ),
    [setIndex],
  );

  const renderScene = ({ route }: *) => {
    switch (route.key) {
      case managerTabs.CATALOG:
        return (
          <AppsList
            apps={catalog}
            state={state}
            dispatch={dispatch}
            active={index === 0}
            currentProgress={currentProgress}
            setAppInstallWithDependencies={setAppInstallWithDependencies}
            setAppUninstallWithDependencies={setAppUninstallWithDependencies}
            setStorageWarning={setStorageWarning}
          />
        );
      case managerTabs.INSTALLED_APPS:
        return (
          <>
            <AppUpdateAll
              state={state}
              appsToUpdate={update}
              dispatch={dispatch}
            />
            <View>
              {device && device.length > 0 && !state.updateAllQueue.length && (
                <View style={[styles.searchBarContainer]}>
                  <LText style={styles.installedAppsText}>
                    <Trans
                      count={device.length}
                      values={{ number: device.length }}
                      i18nKey="manager.storage.appsInstalled"
                    >
                      <LText style={styles.installedAppsText} bold>
                        {"placeholder"}
                      </LText>
                      {"placeholder"}
                    </Trans>
                  </LText>
                  <UninstallAllButton onUninstallAll={onUninstallAll} />
                </View>
              )}
            </View>
            <AppsList
              isInstalledView
              apps={device}
              state={state}
              dispatch={dispatch}
              active={index === 1}
              renderNoResults={renderNoResults}
              currentProgress={currentProgress}
              setAppInstallWithDependencies={setAppInstallWithDependencies}
              setAppUninstallWithDependencies={setAppUninstallWithDependencies}
              setStorageWarning={setStorageWarning}
            />
          </>
        );
      default:
        return null;
    }
  };

  const renderLabel = useCallback(
    ({
      route,
      color,
    }: {
      route: { title: String, key: string },
      color: string,
    }) => (
      <View style={styles.labelStyle}>
        <LText
          bold
          style={{
            ...styles.labelStyle,
            color,
          }}
        >
          {route.title}
        </LText>
        {route.key === managerTabs.INSTALLED_APPS && update.length > 0 && (
          <View style={styles.updateBadge}>
            <LText bold style={styles.updateBadgeText}>
              {update.length}
            </LText>
          </View>
        )}
      </View>
    ),
    [update, managerTabs],
  );

  const elements = [
    <DeviceCard
      distribution={distribution}
      state={state}
      deviceId={deviceId}
      initialDeviceName={initialDeviceName}
      blockNavigation={blockNavigation}
      deviceInfo={deviceInfo}
    />,
    <View>
      <TabBar
        position={position}
        navigationState={{ index, routes }}
        jumpTo={jumpTo}
        style={styles.tabBarStyle}
        indicatorStyle={styles.indicatorStyle}
        tabStyle={styles.tabStyle}
        activeColor={colors.darkBlue}
        inactiveColor={colors.grey}
        labelStyle={styles.labelStyle}
        contentContainerStyle={styles.contentContainerStyle}
        renderLabel={renderLabel}
      />
      <View style={styles.searchBar}>
        <Animated.View
          style={[
            styles.searchBarContainer,
            { opacity: searchOpacity, zIndex: index === 0 ? 2 : -1 },
          ]}
        >
          <SearchModal
            state={state}
            dispatch={dispatch}
            disabled={index !== 0}
            setAppInstallWithDependencies={setAppInstallWithDependencies}
            setAppUninstallWithDependencies={setAppUninstallWithDependencies}
            currentProgress={currentProgress}
            navigation={navigation}
          />
          <View style={styles.filterButton}>
            <AppFilter
              filter={appFilter}
              setFilter={setFilter}
              sort={sort}
              setSort={setSort}
              order={order}
              setOrder={setOrder}
              disabled={index !== 0}
            />
          </View>
        </Animated.View>
        {device.length > 0 && (
          <Animated.View
            style={[
              styles.searchBarContainer,
              styles.searchBarInstalled,
              { opacity: position, zIndex: index === 0 ? -1 : 2 },
            ]}
          >
            <SearchModal
              state={state}
              dispatch={dispatch}
              isInstalledView
              apps={device}
              setAppInstallWithDependencies={setAppInstallWithDependencies}
              setAppUninstallWithDependencies={setAppUninstallWithDependencies}
              currentProgress={currentProgress}
              navigation={navigation}
            />
          </Animated.View>
        )}
      </View>
    </View>,
    <TabView
      renderTabBar={() => null}
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={onIndexChange}
      initialLayout={initialLayout}
      position={position}
      sceneContainerStyle={{}}
    />,
  ];

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        ref={listRef}
        onScroll={onScroll}
        scrollEventThrottle={50}
        data={elements}
        renderItem={({ item }) => item}
        keyExtractor={(_, i) => String(i)}
        stickyHeaderIndices={[1]}
      />
      <InstallProgressBar
        disable={update && update.length > 0}
        state={state}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  searchBar: {
    width,
    backgroundColor: colors.white,
    height: 64,
  },
  searchBarContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    height: 64,
    borderBottomWidth: 1,
    borderColor: colors.lightFog,
    zIndex: 0,
  },
  searchBarInstalled: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    width,
  },
  listContainer: {
    width,
  },
  filterButton: {
    height: 64,
    width: 44,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.lightFog,
    zIndex: 1,
  },
  indicatorStyle: {
    height: 3,
    backgroundColor: colors.live,
  },
  tabBarStyle: {
    backgroundColor: colors.lightGrey,
    elevation: 0,
  },
  tabStyle: {
    backgroundColor: "transparent",
    width: "auto",
    paddingHorizontal: 16,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  labelStyle: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    textTransform: "capitalize",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 19,
    margin: 0,
    paddingHorizontal: 0,
    textAlign: "left",
  },
  updateBadge: {
    marginTop: 2,
    marginLeft: 8,
    backgroundColor: colors.live,
    minWidth: 15,
    height: 15,
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  updateBadgeText: {
    color: colors.white,
    fontSize: 10,
    textAlign: "center",
  },
  contentContainerStyle: {
    marginTop: 16,
    backgroundColor: "transparent",
  },
  installedAppsText: {
    fontSize: 14,
    color: colors.grey,
  },
  noAppInstalledContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 35,
    paddingVertical: 50,
  },
  noAppInstalledText: {
    fontSize: 17,
    lineHeight: 21,
    color: colors.darkBlue,
    marginVertical: 8,
  },
  noAppInstalledDescription: {
    fontSize: 14,
    lineHeight: 17,
    color: colors.grey,
    marginVertical: 8,
    textAlign: "center",
  },
});

export default memo<Props>(AppsScreen);
